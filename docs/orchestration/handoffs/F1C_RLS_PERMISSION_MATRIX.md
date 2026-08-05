# F1C — Matriz de Permisos y RLS FINAL (Catálogo Maestro de Productos)
## Estado: decisiones de arquitectura BLOQUEADAS (1C.1 completado)

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Diseño RLS deny-by-default y matriz de permisos para las 7 tablas de 1C, **aprobado**
en la revisión humana. Reutiliza la infraestructura de 1B.2 (`_access` helpers,
migración 004) y el patrón RLS org-scoped de la migración 007.

---

## 1. Prerrequisitos existentes (reutilizados, sin cambios)

| Helper / RPC | Origen | Uso en 1C |
|--------------|--------|-----------|
| `_access.current_organization_ids()` | migración 004 | scoping org en todas las políticas |
| `_access.has_permission(text)` | migración 004 | chequear `catalog.*` |
| `_access.current_user_id()` | migración 004 | auditoría (actor) |
| `public.current_user_permissions()` | migración 007 | UI (ocultar/mostrar) |
| `permissions` / `role_permissions` | migración 003 | registrar `catalog.*` |

## 2. Permisos nuevos (prefijo `catalog.`) — semántica aprobada

| Permiso | Acción permitida |
|---------|------------------|
| `catalog.read` | Lectura del catálogo de **organizaciones propias** (todas las tablas). |
| `catalog.create` | **Alta de productos, variantes y barcodes**. No administra catálogos base. |
| `catalog.update` | **Edición normal** de productos/variantes/barcodes y transición `active`↔`inactive`. **No** permite transición a `discontinued`. |
| `catalog.archive` | **Transición a `discontinued`**. Independiente de `update`; no implica administración de catálogos base. |
| `catalog.manage` | **Categorías, marcas, unidades, líneas** + **restauración controlada** de `discontinued`. Reservado inicialmente a `administrator`. **No sustituye silenciosamente** a `create`/`update`/`archive`. |

## 3. Matriz de roles (aprobada)

| Rol | catalog.read | catalog.create | catalog.update | catalog.archive | catalog.manage |
|-----|:---:|:---:|:---:|:---:|:---:|
| `administrator` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | ✓ | ✓ | — |
| `cashier` | ✓ | — | — | — | — |
| `operator` | ✓ | — | — | — | — |

Los `role_permissions` correspondientes se cargan en `seed.sql` en la subfase 1C.2
(el `seed.sql` actual **no se modifica** en 1C.1).

## 4. Políticas RLS por tabla (todas con `ENABLE ROW LEVEL SECURITY`)

Patrón común:
- **SELECT**: `organization_id = any(_access.current_organization_ids())` **AND** `_access.has_permission('catalog.read')`.
- **INSERT / UPDATE**: permiso de la operación + `organization_id` dentro de las orgs del usuario.
- **DELETE**: sin políticas (prohibido) **y** `REVOKE DELETE` a `authenticated`.

### 4.1 `product_categories`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.manage` AND org match |
| UPDATE | `catalog.manage` AND org match (cambio de `parent_id` pasa por `_catalog.enforce_category_tree()`) |
| DELETE | — (sin política) |

### 4.2 `product_brands`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.manage` AND org match |
| UPDATE | `catalog.manage` AND org match |
| DELETE | — (sin política) |

### 4.3 `units_of_measure`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.manage` AND org match |
| UPDATE | `catalog.manage` AND org match (evitar cambiar `kind` en uso) |
| DELETE | — (sin política) |

### 4.4 `product_lines`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.manage` AND org match |
| UPDATE | `catalog.manage` AND org match |
| DELETE | — (sin política) |

### 4.5 `products`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match |
| UPDATE | `catalog.update` AND org match (transiciones de estado validadas por `_catalog.enforce_status_transition()`) |
| DELETE | — (sin política; baja lógica por `status`) |

### 4.6 `product_variants`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match; `product_id` de la misma org (FK compuesta) |
| UPDATE | `catalog.update` AND org match (transiciones por `_catalog.enforce_status_transition()`) |
| DELETE | — (sin política) |

### 4.7 `product_barcodes`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match; `variant_id` de la misma org |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política) |

## 5. Cómo `catalog.update` NO puede ejecutar `archive`

**Regla: nunca solo validación frontend.** La separación se garantiza en la base:

1. **Trigger de transición `_catalog.enforce_status_transition()`**
   (`BEFORE UPDATE OF status` en `products` y `product_variants`, `SECURITY INVOKER`,
   `search_path=''`): examina `OLD.status` → `NEW.status` y el permiso del actor
   (`_access.has_permission`):
   - `active`↔`inactive`: exige `catalog.update`.
   - `→ discontinued`: exige **`catalog.archive`**; un actor con solo `catalog.update`
     recibe excepción SQL aunque el RLS de UPDATE le permita editar la fila.
   - `discontinued → active/inactive` (restauración): exige **`catalog.manage`**.
2. **RLS**: la política UPDATE exige `catalog.update`; el trigger añade la barrera
   adicional para `discontinued`.
3. **Camino de escritura recomendado (defensa en profundidad):** las transiciones a
   `discontinued`/restauración se realizan mediante **RPC controladas** en
   `_catalog` (p. ej. `_catalog.archive_variant(...)`, `_catalog.restore_variant(...)`)
   que ejecutan la verificación de permiso y la mutación atómica. El frontend solo
   oculta botones (`current_user_permissions()`); la seguridad vive en la base.

## 6. Sobre DELETE y descontinuación (D-C14)

- **No existe DELETE** en ninguna tabla de catálogo 1C (sin política RLS + `REVOKE DELETE`).
- Baja lógica: `UPDATE ... SET status` con los permisos de la sección 5.
- `catalog.archive` controla la entrada a `discontinued`; `catalog.manage` la
  restauración. Las filas descontinuadas se conservan para lecturas históricas.

## 7. Principios (heredados)

- **Deny-by-default**: RLS habilitado en las 7 tablas; sin excepción `service_role`.
- El cliente usa `authenticated` (anon sin permiso). `service_role` solo en
  `src/lib/supabase/admin.ts` (D15, sin cambio en 1C).
- Prefijos `catalog.*` siguen la convención `{dominio}.{accion}` de `10-arch/10`.
- `current_user_permissions()` alimenta la UI; la base valida siempre (defensa en profundidad).
