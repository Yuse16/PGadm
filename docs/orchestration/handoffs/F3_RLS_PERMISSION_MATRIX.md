# F3 — Matriz de Permisos y RLS (Layout — Fase 3)
## Estado: candidato propuesto en kickoff; D-L01…D-L14 APPROVED 2026-08-08

**Fecha:** 2026-08-08
**Rama:** `feature/f3-PG-LAYOUT-006-layout`

Diseño RLS deny-by-default y matriz de permisos **candidatos** para las tablas de
layout, derivado del patrón de 1D (`F1D_RLS_PERMISSION_MATRIX.md`) y de
`02-layout/LAYOUT_EDITING_RULES.md`. Reutiliza la infraestructura de 1B (`_access`
helpers, migración 004), el patrón RLS org-scoped de la migración 007 y el patrón de
catálogo 1C / inventario 1D.

---

## 1. Prerrequisitos existentes (reutilizados, sin cambios)

| Helper / RPC | Origen | Uso en F3 |
|--------------|--------|-----------|
| `_access.current_organization_ids()` | migración 004 | scoping org en todas las políticas |
| `_access.has_permission(text)` | migración 004 | chequear `layout.*` |
| `_access.current_user_id()` | migración 004 | auditoría y `changed_by` |
| `public.current_user_permissions()` | migración 007 | UI (ocultar/mostrar) |
| `permissions` / `role_permissions` | migración 003 | registrar `layout.*` |
| `branches` (RLS org-scoped) | migraciones 002/007 | FK de `layouts.branch_id` |
| `product_variants` (RLS org-scoped) | migraciones 008/007 | FK de posición (1C) |

## 2. Permisos propuestos (prefijo `layout.`)

| Permiso | Acción permitida | Corresponde a |
|---------|------------------|---------------|
| `layout.read` | Consultar layout, elementos, posiciones, versiones e historial de orgs propias | Toda la tienda: ver plano, tocar mueble y ver stock/productos |
| `layout.edit` | Editar sobre borrador: agregar/mover/rotar/redimensionar/bloquear/ocultar/duplicar elementos y asignar productos | Gerente/comercial: editar el plano |
| `layout.publish` | Publicar versión (draft → published) y restaurar versiones | Gerente: aprobar publicación (D-L04) |
| `layout.manage` | Administrar layout completo: archivar/borrar borradores, renombrar, reasignar tienda | Administrator |

## 3. Matriz de roles (propuesta — requiere validación con negocio, D-L10)

| Rol | layout.read | layout.edit | layout.publish | layout.manage |
|-----|:---:|:---:|:---:|:---:|
| `administrator` | ✓ | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | ✓ | — |
| `cashier` | ✓ | — | — | — |
| `operator` | ✓ | — | — | — |

> Pregunta abierta (D-L10): las capacidades de "Comercial" y "Almacén" de
> `05-inventory/30_PERMISSIONS.md` / `LAYOUT_EDITING_RULES.md` (editar plano, sugerir
> reemplazo compatible) no encajan 1:1 con los 4 roles existentes. Se propone mapear
> la función "Comercial" al permiso `layout.edit` y "Gerente" a `layout.publish`; si
> el negocio requiere roles distintos, se amplía el catálogo en la migración de F3.

Los `role_permissions` correspondientes se cargarían en `seed.sql` en la subfase 3.2.

## 4. Políticas RLS propuestas por tabla (todas con `ENABLE ROW LEVEL SECURITY`)

Patrón común:
- **SELECT**: `organization_id = any(_access.current_organization_ids())` **AND**
  `_access.has_permission('layout.read')`.
- **INSERT / UPDATE**: permiso de la operación + `organization_id` dentro de las orgs
  del usuario.
- **DELETE**: sin políticas (prohibido) **y** `REVOKE DELETE` a `authenticated`
  (historial y versiones son históricos; borrado de borradores vía `layout.manage` con
  baja lógica).

### 4.1 `layouts`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `layout.read` |
| INSERT | `layout.manage` AND org match (`branch_id` de la misma org) |
| UPDATE | `layout.edit` (draft) / `layout.publish` (publicar/archivar) AND org match |
| DELETE | — (sin política; baja por `status='archived'`) |

### 4.2 `layout_elements`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `layout.read` |
| INSERT / UPDATE | `layout.edit` AND org match (`layout_id` de la misma org, FK compuestas) |
| DELETE | — (sin política; ocultar vía `layout.edit`; sin borrado físico) |

### 4.3 `layout_positions`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `layout.read` |
| INSERT / UPDATE | `layout.edit` AND org match (`element_id`/`variant_id` de la misma org) |
| DELETE | — (sin política; desasignar producto vía UPDATE con `variant_id NULL`) |

### 4.4 `layout_version_history`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `layout.read` |
| INSERT | `layout.edit`/`layout.publish` AND org match (generado por use cases) |
| UPDATE | — (sin política; append-only) |
| DELETE | — (sin política) |

## 5. Defensa en profundidad

- El cliente usa `authenticated`; `service_role` **nunca** en cliente (patrón
  `feature-security`).
- La publicación, restauración, asignación de producto y detección de revisión se
  realizan mediante **use case / RPC controlado** (un solo camino de escritura), no
  por UPDATE directo del cliente (defensa en profundidad; patrón 1C §5 / 1D §5).
- Las validaciones de negocio (editar solo sobre `draft`, no reasignar por stock,
  historial append-only, código permanente) viven en la capa de aplicación/DB; la UI
  solo oculta botones vía `current_user_permissions()`.
- Auditoría de eventos de layout (creación, edición, publicación, restauración,
  asignación) usando el patrón `_audit` de 1C.5/1D (D-C10/D-C18/D-L12) —
  `_audit.layout_events`.

## 6. Principios (heredados)

- **Deny-by-default**: RLS habilitado en las 4 tablas; sin excepción `service_role`.
- Prefijos `layout.*` siguen la convención `{dominio}.{accion}` de `10-arch/10`.
- `current_user_permissions()` alimenta la UI; la base valida siempre.
- Sin DELETE físico en ninguna tabla de layout (historias de posición y versiones
  conservadas).
