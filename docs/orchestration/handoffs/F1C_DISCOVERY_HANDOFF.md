# F1C — Discovery Handoff (Catálogo Maestro de Productos)
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Base:** `0674e9f` (origin/develop)

Entrega del descubrimiento de la fase 1C. Define el estado de entrada, qué se
aprendió, qué se decidió y qué se debe revisar antes de implementar.

---

## 1. Estado de entrada

- `develop` sincronizado en `0674e9f07499e792e0bd90b01ed32dd893e02827` (merge PR #8,
  fase 1B.3 integrada).
- Worktree de 1C creado desde `origin/develop` sin commits propios.
- No hay código, migraciones, UI ni datos de catálogo en el repositorio.

## 2. Alcance del descubrimiento

Estudiado y resuelto (ver `F1C_SCOPE_MATRIX.md`):

| Grupo | Resultado |
|-------|-----------|
| Entidades | 7 tablas: `product_categories`, `product_brands`, `units_of_measure`, `product_lines`, `products`, `product_variants`, `product_barcodes` |
| Relaciones | producto/variante separados; barcodes múltiples; categorías jerárquicas (≤3 niveles) |
| Unicidad | `upper(sku)`, `upper(barcode)`, `lower(external_id)` únicos por org |
| Permisos | `catalog.read/create/update/archive/manage` |
| RLS | deny-by-default org-scoped, reutilizando `_access` (migración 004) y patrón 007 |
| Diferido | impuestos, listas de precios, imágenes/Storage, sustitutos, visibilidad por sucursal, proveedores, sync Intelisis |

## 3. Entregables (8 documentos F1C)

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | `F1C_KICKOFF_CONTRACT.md` | Contrato de arranque; decisiones D-C01…D-C17; alcance vs. diferido |
| 2 | `F1C_DOCUMENT_USAGE_INDEX.md` | Fuentes realmente consultadas (auditable) |
| 3 | `F1C_SCOPE_MATRIX.md` | Matriz de 18 puntos de estudio |
| 4 | `F1C_DATA_MODEL_PROPOSAL.md` | Modelo de datos propuesto (7 tablas + diferidas) |
| 5 | `F1C_RLS_PERMISSION_MATRIX.md` | Políticas RLS y permisos `catalog.*` |
| 6 | `F1C_TEST_PLAN.md` | Casos de aceptación CA-1…CA-25 + línea base de comandos |
| 7 | `F1C_IMPLEMENTATION_SLICES.md` | Subfases 1C.1…1C.5 con definición de terminado |
| 8 | `F1C_DISCOVERY_HANDOFF.md` | Este documento |

## 4. Decisiones clave (resumen; detalle en D-C01…D-C17)

- Modelo **producto/variante** separado; SKU y barcodes en la variante.
- Catálogo **org-scoped** con FK compuestas; sin visibilidad por sucursal en 1C.
- Precios de **referencia** (dato, no regla); listas de precios diferidas.
- Baja lógica por `status`; sin DELETE; descontinuado conserva fila.
- `external_id` = identificador Intelisis único por org; sin sync.
- Permisos `catalog.*` alineados a convención `{dominio}.{accion}`.

## 5. Puntos abiertos para revisión humana

1. Profundidad de categorías: ¿3 niveles suficientes? ¿trigger o solo validación en app?
2. Nombres de roles con `catalog.*` en `seed.sql` actual (roles de datos).
3. ¿`catalog.archive` independiente o subsumido en `update`?
4. Límites de `numeric(10,2)` en precios de referencia.
5. `is_primary` de barcode a nivel variante (vs. producto).

Detalle en `F1C_TEST_PLAN.md` sección 7.

## 6. Lo que NO se hizo (por diseño)

- No hay migración, código, UI, inventario, ventas, compras, CRM ni IA.
- No hay cambios a `develop`; no se tocó el worktree `identity-rbac-rls`; no se
  eliminó ninguna rama.
- No hay integración real con Intelisis; `service_role` nunca en cliente.
- No se abrió PR: la entrega queda en la rama `feature/f1c-PG-CATALOG-004-product-master`.

## 7. Próximos pasos tras aprobación

1. Registrar decisiones en `DECISION_LOG.md` (D-C01…D-C17) tras revisión humana.
2. Ejecutar slice 1C.1 (cierre de preguntas abiertas).
3. Implementar 1C.2…1C.5 según `F1C_IMPLEMENTATION_SLICES.md`.
4. Handoff de la fase 1C a la siguiente (inventario/ventas) con referencia a este paquete.
