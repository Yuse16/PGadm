# F1C — Matriz de Permisos y RLS (Catálogo Maestro de Productos)
## Planificación — sin migración todavía

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Diseño RLS deny-by-default y matriz de permisos para las 7 tablas de 1C.
Reutiliza la infraestructura de 1B.2 (`_access` helpers, migración 004) y el
patrón RLS org-scoped de la migración 007.

---

## 1. Prerrequisitos existentes (reutilizados, sin cambios)

| Helper / RPC | Origen | Uso en 1C |
|--------------|--------|-----------|
| `_access.current_organization_ids()` | migración 004 | scoping org en todas las políticas |
| `_access.has_permission(text)` | migración 004 | chequear `catalog.*` |
| `_access.current_user_id()` | migración 004 | auditoría (actor) |
| `public.current_user_permissions()` | migración 007 | UI (ocultar/mostrar) |
| `permissions` / `role_permissions` | migración 003 | registrar `catalog.*` |

## 2. Permisos nuevos propuestos (prefijo `catalog.`)

| Permiso | Acción permitida | Asignación sugerida en seed |
|---------|------------------|-----------------------------|
| `catalog.read` | Consultar catálogo (todas las tablas, solo su org) | todos los roles |
| `catalog.create` | Crear categorías, marcas, unidades, líneas, productos, variantes, barcodes | catalogista |
| `catalog.update` | Modificar entidades de catálogo | catalogista |
| `catalog.archive` | Transición a `inactive`/`discontinued` | catalogista, gerente |
| `catalog.manage` | Administrar unidades/líneas/estructura, limpiar datos de prueba | admin de org |

Regla de herencia: `catalog.read` es base de todas; `manage` implica las demás.
Los `role_permissions` se cargan en `seed.sql` (subfase 1C.4).

## 3. Políticas RLS por tabla (todas con `ENABLE ROW LEVEL SECURITY`)

Patrón común:
- **SELECT**: `organization_id = any(_access.current_organization_ids())` **AND** `_access.has_permission('catalog.read')`.
- **INSERT**: `_access.has_permission('catalog.create')` con `organization_id` dentro de las orgs del usuario.
- **UPDATE**: `_access.has_permission('catalog.update')` y fila de su org.
- **DELETE**: sin políticas (prohibido); baja lógica vía `catalog.archive` + `status`.

### 3.1 `product_categories`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND `organization_id` en `current_organization_ids()`; padre si existe: `(organization_id, parent_id)` válido y `status` activo |
| UPDATE | `catalog.update` AND org match; cambio de `parent_id` validado (sin ciclos, ≤3 niveles) |
| DELETE | — (sin política) |

### 3.2 `product_brands`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política) |

### 3.3 `units_of_measure`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match |
| UPDATE | `catalog.update` AND org match (evitar cambiar `kind` en uso) |
| DELETE | — (sin política) |

### 3.4 `product_lines`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política) |

### 3.5 `products`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match; FK compuestas garantizan misma org |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política; `status='discontinued'` vía `catalog.archive`) |

### 3.6 `product_variants`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match; `product_id` de la misma org (FK compuesta) |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política) |

### 3.7 `product_barcodes`

| Operación | Condición RLS |
|-----------|---------------|
| SELECT | org match AND `catalog.read` |
| INSERT | `catalog.create` AND org match; `variant_id` de la misma org |
| UPDATE | `catalog.update` AND org match |
| DELETE | — (sin política) |

## 4. Sobre DELETE y descontinuación (D-C14)

- **No existe DELETE** en ninguna tabla de catálogo 1C.
- Baja lógica: `UPDATE ... SET status = 'inactive' | 'discontinued'` con `catalog.update`
  o `catalog.archive`.
- `catalog.archive` es el permiso de transición de estado; un rol con `catalog.update`
  puede editar, pero no descontinuar, salvo que también tenga `archive`.
- Validación: no se puede descontinuar la **última variante activa** de un producto
  (regla de integridad, D-C13).

## 5. Roles de ejemplo y permisos `catalog.*` en seed

| Rol (org) | catalog.read | catalog.create | catalog.update | catalog.archive | catalog.manage |
|-----------|:---:|:---:|:---:|:---:|:---:|
| `admin` (PGM) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `catalogista` (PGM) | ✓ | ✓ | ✓ | ✓ | — |
| `vendedor` (PGM) | ✓ | — | — | — | — |
| `admin` (PGM-DEMO-B) | ✓ | ✓ | ✓ | ✓ | ✓ |

> Los nombres concretos de roles dependen del rol de datos actuales en `seed.sql`
> (por confirmar en la revisión humana del `TEST_PLAN`).

## 6. Principios (heredados)

- **Deny-by-default**: RLS habilitado en las 7 tablas; sin excepción `service_role`.
- El cliente usa `authenticated` (anon sin permiso). `service_role` solo en
  `src/lib/supabase/admin.ts` (D15, sin cambio en 1C).
- Prefijos `catalog.*` siguen la convención `{dominio}.{accion}` de `10-arch/10`.
- `current_user_permissions()` alimenta la UI; el servidor valida siempre (defensa en profundidad).
