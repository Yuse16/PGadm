# F1C — Human Architecture Review (Revisión Humana de Arquitectura)
## Estado: decisiones BLOQUEADAS (1C.1 completado)

**Fecha de revisión:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Alcance:** cierre y bloqueo de decisiones arquitectónicas del catálogo maestro 1C.

Registro formal de la revisión humana: preguntas resueltas, correcciones estructurales,
decisiones aprobadas y riesgos abiertos. Complementa `DECISION_LOG.md` y los 8
documentos F1C (ahora 9 con el anexo de comercialización).

---

## 1. Preguntas de revisión — RESUELTAS

| # | Pregunta | Resolución |
|---|----------|-----------|
| 1 | Profundidad de categorías: ¿3 niveles suficientes? ¿trigger o solo validación en app? | **3 niveles, validado en la base.** Función privada `_catalog.enforce_category_tree()` (`SECURITY INVOKER`, `search_path=''`) en trigger `BEFORE INSERT OR UPDATE OF parent_id` de `product_categories`; rechaza self-parent, ciclos y profundidad >3. La lógica de catálogo vive en el esquema `_catalog`, **no** en `_access`. |
| 2 | Nombres de roles con `catalog.*` en `seed.sql` actual | Roles de datos existentes: **`administrator`**, **`manager`**, **`cashier`**, **`operator`**. Matriz aprobada (ver `F1C_RLS_PERMISSION_MATRIX.md` §3). `role_permissions` se cargarán en 1C.2 (seed no modificado en 1C.1). |
| 3 | ¿`catalog.archive` independiente o subsumido en `update`? | **Independiente.** `catalog.update` = edición normal + `active↔inactive`; `catalog.archive` = transición a `discontinued`; `catalog.manage` = catálogos base + restauración controlada, **sin sustituir** a los demás permisos. |
| 4 | Tratamiento numérico del precio de referencia | **`numeric(14,4)`** con `CHECK (>= 0)`. |
| 5 | `product_barcodes.is_primary`: ¿nivel variante o producto? | **Solo por variante** (índice parcial `WHERE is_primary`). **No existe** barcode primario a nivel `products`. |

## 2. Correcciones estructurales aplicadas (obligatorias)

| # | Corrección | Impacto |
|---|-----------|---------|
| 1 | `UNIQUE (organization_id, id)` en todas las tablas padre destino de FK compuesta | `product_categories`, `product_brands`, `units_of_measure`, `product_lines`, `products`, `product_variants` (el PK ya lo garantiza; se hace explícito por decisión humana) |
| 2 | Unicidades case-insensitive mediante **índices funcionales** `upper(trim(...))` | `(organization_id, upper(trim(code)))`, `(organization_id, upper(trim(sku)))`, `(organization_id, upper(trim(barcode)))`, `(organization_id, upper(trim(external_id)))` parcial |
| 3 | `CHECK trim(valor) <> ''` | En códigos, SKU, barcode, nombres y descripciones obligatorias |
| 4 | `external_id` normalizado, case-insensitive por org | Índice único funcional parcial; regla "no descripción como ID" |
| 5 | FK compuestas `(organization_id, parent_id)` mantenidas | Impide cruces entre organizaciones |
| 6 | RLS deny-by-default mantenida | Las 7 tablas con políticas de la matriz aprobada |
| 7 | `catalog.update` no puede ejecutar `archive` | Trigger `_catalog.enforce_status_transition()` o RPC controlada; **nunca** solo validación frontend (detalle en `F1C_RLS_PERMISSION_MATRIX.md` §5) |

## 3. Decisiones aprobadas (D-C01 … D-C17)

Registradas con estado **APPROVED** en `DECISION_LOG.md` (2026-08-04). Resumen del
modelo final:

- **Entidades (7):** `product_categories`, `product_brands`, `units_of_measure`,
  `product_lines`, `products`, `product_variants`, `product_barcodes`.
- **Producto/variante:** separados; SKU y barcodes en la variante; toda presentación
  vendible con SKU/barcode distinto es una variante.
- **Barcodes:** múltiples por variante, 1 primario por variante, sin primario a nivel producto.
- **Unidades:** `base_unit_id`/`sale_unit_id` + `base_units_per_sale_unit numeric CHECK (>0)`;
  `kind` ∈ `count|length|area|volume|mass|package`.
- **Precio:** `reference_price numeric(14,4)` única columna, asociada a `sale_unit_id`.
- **Ciclo de vida:** producto nace `inactive`; activo exige ≥1 variante activa; la
  última variante activa está protegida mientras el producto sea `active`;
  descontinuado conserva fila; sin DELETE físico.
- **Escoping:** org-scoped con `UNIQUE(organization_id, id)` + FK compuestas + RLS.
- **Permisos:** `catalog.read/create/update/archive/manage` (matriz de roles aprobada).
- **Enforcement:** triggers `_catalog` (SECURITY INVOKER, `search_path=''`).

## 4. Riesgos abiertos / pendientes de validación

| Riesgo | Estado | Acción |
|--------|--------|--------|
| `seed.sql` no contiene aún los `role_permissions` de `catalog.*` | Aceptado | Cargar en 1C.2 (prohibido en 1C.1) |
| Contenido íntegro del PDF de Comercialización no extraíble como texto (imágenes; listas descargables externas: precios por formato, paquete ahorres, remate, novedades) | Abierto | Validar con el equipo comercial en fase de Comercialización; las listas externas deberán mapearse contra `external_id`/SKU del catálogo |
| Etiquetas/descuentos/incentivos de agosto son **temporales** y deben leerse como evidencia operativa, no como regla permanente | Mitigado | Documentado como anexo; fuera de 1C por principio |
| `DURANGO` (pág. 23 del PDF) es imagen sin texto; Minisplit/Boiler (págs. 11-12) muestran umbrales de incentivo idénticos — posible error o copia | Abierto | Requiere validación humana del área comercial |
| `Monedero` (pág. 2) mencionado como línea/etiqueta sin detalle en el texto extraído | Abierto | Validar con comercialización |
| Elección entre trigger de transición y RPC controlada para `archive` | Decidido (trigger + RPC recomendada) | Confirmar en 1C.2 al implementar |

## 5. Anexo operativo (comercialización agosto 2026)

- Evidencia operativa analizada en `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`.
- Confirmado: campañas, colores de etiquetas, incentivos, precios mensuales y reglas
  de Outlet **no** se modelan como columnas de `products`/`product_variants`.
- 1C solo aporta las referencias maestras para aplicarlas después.
