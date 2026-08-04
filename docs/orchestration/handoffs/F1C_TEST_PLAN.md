# F1C — Plan de Pruebas (Catálogo Maestro de Productos)
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Plan de pruebas de la fase 1C. Se ejecutará cuando exista implementación; aquí se
define el alcance y los casos de aceptación para que la revisión humana valide.

---

## 1. Comandos de validación (heredados de `package.json`)

| Comando | Objetivo |
|---------|----------|
| `npm run lint` | ESLint en `src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` (unit + RSC tests bajo `src/tests/`) |
| `npm run db:lint` | reglas de seguridad/RLS de Supabase (`supabase db lint`) |
| `npm run db:test` | tests SQL de la base (pgTAP) |
| `npm run db:verify` | `scripts/verify-db.mjs` (chequeo de estado DB) |
| `npm run e2e:identity` / `e2e:auth` | flujos E2E existentes (deben seguir en verde, sin regresión) |

> Sin cambios de código en 1C-discovery; estos comandos solo se marcan como
> línea base en esta fase y se ejecutarán en las subfases de implementación.

## 2. Casos de aceptación por requisito funcional

### 2.1 Catálogo base (categorías, marcas, unidades, líneas)
- CA-1: crear categoría raíz; crear subcategoría referenciando a la raíz en la **misma org**.
- CA-2: falla crear subcategoría con `parent_id` de **otra org** (FK compuesta).
- CA-3: falla asignar categoría a nivel > 3 (validación de profundidad).
- CA-4: crear marca/unidad/línea; duplicado de `code` en la misma org rechazado (case-insensitive).
- CA-5: el mismo `code` en **otras** orgs está permitido (aislamiento).

### 2.2 Productos y variantes
- CA-6: crear producto sin SKU → sin variantes; activar requiere ≥1 variante activa.
- CA-7: crear variante con `sku`; duplicado de SKU en la misma org rechazado (case-insensitive).
- CA-8: `pieces_per_sale_unit` debe ser > 0 (CHECK); NULL rechazado.
- CA-9: barcode duplicado en la misma org rechazado; permitido en otra org.
- CA-10: solo un barcode primario por variante (índice parcial).
- CA-11: `external_id` único por org (parcial, permite NULL); dos productos con el mismo código Intelisis en la misma org rechazados.

### 2.3 Baja lógica (D-C14)
- CA-12: `status='discontinued'` conserva la fila; el producto sigue legible para
  lecturas históricas (ventas futuras).
- CA-13: no se puede descontinuar la **última variante activa** de un producto.
- CA-14: no existe camino de `DELETE` (sin política RLS); intento rechazado.

## 3. Casos de seguridad RLS (deny-by-default)

- CA-15: usuario sin `catalog.read` no ve filas de ninguna tabla de catálogo.
- CA-16: usuario con `catalog.read` solo ve filas de sus organizaciones
  (`_access.current_organization_ids()`), nunca de otra org.
- CA-17: usuario sin `catalog.create` recibe rechazo en INSERT aunque su org coincida.
- CA-18: usuario sin `catalog.update` no puede modificar filas de su org.
- CA-19: usuario sin `catalog.archive` no puede transicionar a `discontinued`.
- CA-20: `service_role`/admin: cliente no contiene `service_role` (test existente
  `admin-separation.test.ts` se mantiene; los repos de catálogo respetan la regla).
- CA-21: fila insertada con `organization_id` ajeno a las orgs del usuario → rechazada
  (INSERT con check de `current_organization_ids()`).

## 4. Casos de consistencia de datos y convenciones

- CA-22: los permisos `catalog.*` existen en `permissions` y se asignan en
  `role_permissions` (seed); `current_user_permissions()` los expone.
- CA-23: `updated_at` se actualiza vía trigger `_core.updated_at()` en las 7 tablas.
- CA-24: auditoría: `_audit.catalog_events` registra create/update/archive con actor
  (`_access.current_user_id()`) y timestamp; append-only.
- CA-25: sin borrado físico en ninguna tabla de catálogo.

## 5. Pruebas de no-regresión

- Toda la suite existente (`src/tests/**`, features organization/identity) en verde.
- `npm run lint`, `npm run typecheck` en verde.
- `npm run db:verify` en verde.
- No aparecen nuevas dependencias en `package.json`.

## 6. Datos de prueba planificados (seed 1C.2)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Unidades | 7 | pieza, caja, bulto, juego, paquete, tarima, m² (ambas orgs) |
| Marcas | 2–3 | por org (ej. "Marca demo A/B") |
| Categorías | 4–6 | 2 niveles: ej. "Plomería" → "Tuberías" / "Conexiones" |
| Líneas | 2 | referencia Intelisis |
| Productos | 2 | 1 con 2 variantes (caja/pieza), 1 simple |
| Variantes | 3 | SKUs distintos, `pieces_per_sale_unit` 1 y 12 |
| Barcodes | 4 | 1 primario + 1 secundario en la variante múltiple |

Los datos demo quedan aislados por org (PGM y PGM-DEMO-B) — sin datos globales
(D-C07).

## 7. Revisión humana requerida (no automatizable en esta fase)

1. Validar profundidad máxima de categorías (3 niveles) y si se requiere trigger.
2. Validar nombres de roles con catálogo de permisos en `seed.sql` actual.
3. Validar si `catalog.archive` debe ser un permiso independiente o subsumido en `update`.
4. Validar el tratamiento de `numeric(10,2)` para precios de referencia (límite).
5. Confirmar que `product_barcodes.is_primary` único-por-variante es suficiente
   (versus barcode primario a nivel producto).

## 8. Criterio de salida

- Revisión humana con aprobación de las 5 preguntas de la sección 7.
- Casos CA-1…CA-25 diseñados y trazables a decisiones D-C01…D-C17.
- Línea base de `npm run validate` y `db:*` documentada (a ejecutar en 1C.2+).
