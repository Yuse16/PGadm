# F1C — Discovery Handoff (Catálogo Maestro de Productos)
## Estado: decisiones BLOQUEADAS (1C.1 completado) + anexo comercial agosto 2026

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Base:** `0674e9f` (origin/develop) · HEAD `a4236f7` (discovery)

Entrega del descubrimiento de la fase 1C y del cierre de decisiones arquitectónicas
(1C.1). Define estado de entrada, aprendizajes, decisiones **aprobadas** y qué se
debe hacer antes de implementar.

---

## 1. Estado de entrada

- `develop` sincronizado en `0674e9f07499e792e0bd90b01ed32dd893e02827` (merge PR #8,
  fase 1B.3 integrada).
- Worktree de 1C creado desde `origin/develop`; discovery entregado en `a4236f7`.
- No hay código, migraciones, UI ni datos de catálogo en el repositorio.

## 2. Alcance del descubrimiento (completado)

Estudiado y **aprobado por revisión humana** (ver `F1C_HUMAN_ARCHITECTURE_REVIEW.md`):

| Grupo | Resultado |
|-------|-----------|
| Entidades | 7 tablas: `product_categories`, `product_brands`, `units_of_measure`, `product_lines`, `products`, `product_variants`, `product_barcodes` |
| Relaciones | producto/variante separados; barcodes múltiples (1 primario por variante); categorías jerárquicas (≤3 niveles) |
| Unicidad | `upper(trim(sku))`, `upper(trim(barcode))`, `upper(trim(external_id))`, `upper(trim(code))` por org + `CHECK trim()<>''` |
| Estructura | `UNIQUE(organization_id, id)` en tablas padre; FK compuestas org-scoped |
| Permisos | `catalog.read/create/update/archive/manage`; matriz de roles administrator/manager/cashier/operator |
| RLS | deny-by-default org-scoped, reutilizando `_access` (004) y patrón 007 |
| Enforcement | Triggers `_catalog` (SECURITY INVOKER, `search_path=''`): árbol de categorías, variante activa, transiciones |
| Diferido | impuestos, listas de precios, imágenes/Storage, sustitutos, visibilidad por sucursal, proveedores, sync Intelisis, **comercialización/promociones** |

## 3. Entregables (9 documentos F1C + DECISION_LOG)

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | `F1C_KICKOFF_CONTRACT.md` | Contrato; decisiones D-C01…D-C17 **APPROVED**; alcance vs. diferido |
| 2 | `F1C_DOCUMENT_USAGE_INDEX.md` | Fuentes realmente consultadas (incluye PDF de comercialización) |
| 3 | `F1C_SCOPE_MATRIX.md` | Matriz de 18 puntos de estudio + correcciones estructurales + anexo comercial |
| 4 | `F1C_DATA_MODEL_PROPOSAL.md` | **Modelo final** (7 tablas + diferidas + triggers `_catalog`) |
| 5 | `F1C_RLS_PERMISSION_MATRIX.md` | Matriz RLS/permisos final + semántica + transiciones |
| 6 | `F1C_TEST_PLAN.md` | Casos CA-1…CA-43 ajustados + preguntas resueltas |
| 7 | `F1C_IMPLEMENTATION_SLICES.md` | Subfases 1C.1…1C.5; 1C.1 completada |
| 8 | `F1C_HUMAN_ARCHITECTURE_REVIEW.md` | **Revisión humana:** preguntas, correcciones, decisiones, riesgos |
| 9 | `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md` | **Anexo operativo:** comercialización agosto 2026 (evidencia) |
| — | `DECISION_LOG.md` | D-C01…D-C17 registradas **APPROVED** (2026-08-04) |

## 4. Decisiones clave (D-C01…D-C17 APPROVED)

- Modelo **producto/variante** separado; SKU y barcodes en la variante; sin barcode
  primario a nivel producto.
- Categorías jerárquicas ≤3 niveles validadas en base (`_catalog.enforce_category_tree`).
- Catálogo **org-scoped** con `UNIQUE(organization_id, id)` + FK compuestas; sin
  visibilidad por sucursal en 1C.
- Precio de referencia **único** `reference_price numeric(14,4)` asociado a
  `sale_unit_id`; listas de precios diferidas.
- Unidades: `base_unit_id`/`sale_unit_id` + `base_units_per_sale_unit`; `kind` en
  `count/length/area/volume/mass/package`.
- Ciclo de vida: producto nace `inactive`; activo exige ≥1 variante activa; última
  variante activa protegida; baja lógica por `status`; sin DELETE.
- Permisos `catalog.*` con `archive` independiente y `manage` administrativo.
- `external_id` normalizado case-insensitive por org; sin sync.
- **Comercialización agosto 2026:** evidencia operativa analizada; promociones,
  etiquetas, incentivos y Outlet **fuera** de 1C (referencias maestras solo).

## 5. Puntos abiertos para revisión humana — RESUELTOS

| # | Pregunta | Resolución |
|---|----------|-----------|
| 1 | Profundidad de categorías / dónde se valida | 3 niveles; trigger `_catalog.enforce_category_tree()` |
| 2 | Roles con `catalog.*` | administrator / manager / cashier / operator |
| 3 | `catalog.archive` independiente | Sí; `manage` no sustituye a los demás |
| 4 | Precio de referencia | `numeric(14,4)`; una sola columna `reference_price` |
| 5 | Barcode primario | Por variante; no a nivel producto |

Detalle en `F1C_HUMAN_ARCHITECTURE_REVIEW.md` §1.

## 6. Lo que NO se hizo (por diseño)

- No hay migración, código, UI, inventario, ventas, compras, CRM ni IA.
- No hay cambios a `develop`; no se tocó el worktree `identity-rbac-rls`; no se
  eliminó ninguna rama.
- No hay integración real con Intelisis; `service_role` nunca en cliente.
- No se modificó `seed.sql`; no se inició la migración 008.
- No se crearon migraciones ni código de Comercialización (solo documentación).
- No se abrió PR: la entrega queda en la rama `feature/f1c-PG-CATALOG-004-product-master`.

## 7. Próximos pasos

1. **1C.2** — migración `00000000000008_product_master.sql` + seed + verificación DB
   (según `F1C_IMPLEMENTATION_SLICES.md`; pendiente de instrucción expresa).
2. **1C.3–1C.5** — dominio/use cases, repositorios supabase/seguridad, auditoría.
3. Validación con el área comercial de los riesgos del anexo
   (`F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md` §9) antes de la fase de
   Comercialización.
4. Handoff de la fase 1C a la siguiente (inventario/ventas) con referencia a este paquete.
