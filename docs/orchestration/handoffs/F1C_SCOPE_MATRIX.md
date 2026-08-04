# F1C — Scope Matrix: Catálogo Maestro de Productos
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Matriz de los 18 puntos de estudio obligatorios: qué pertenece a 1C y qué se difiere.

Leyenda: **1C** = se modela/implementa en 1C · **DIF** = diferido (con nota) · **DISEÑO** = solo diseño, sin tabla.

| # | Punto de estudio | Decisión | Alcance | Justificación |
|---|------------------|----------|---------|---------------|
| 1 | Categorías y subcategorías | Jerárquicas (auto-referencia) | **1C** | `product_categories.parent_id` (máx. 3 niveles); catálogos comerciales necesitan filtrado por familia → categoría. Coherente con `14-admin/21` (líneas, categorías) y `10-arch/13` |
| 2 | Marcas | Tabla plana por organización | **1C** | `product_brands`; catálogo de referencia simple |
| 3 | Unidades de medida | Base y venta separadas | **1C** | `units_of_measure` + `base_unit_id`/`sale_unit_id`/factor por variante; **tabla general de conversiones DIFERIDA** (`05-inventory/11`: no asumir unidad universal) |
| 4 | Productos | Tabla `products` (entidad base) | **1C** | Comparte marca/categoría/línea/ficha; sin SKU |
| 5 | Variantes o presentaciones | Tabla separada `product_variants` | **1C** | Presentaciones con SKU/barcode/unidad de venta/datos de caja; stock futuro será por variante y almacén |
| 6 | SKU interno | Pertenece a la variante | **1C** | `product_variants.sku` único por org (case-insensitive) |
| 7 | Código de barras | Múltiples por variante | **1C** | `product_barcodes` (varios códigos, 1 primario por variante); único por org |
| 8 | Código/ID externo Intelisis | `external_id` en producto | **1C** | Único por organización; regla "no descripción como identificador" (`20-int/27`); sync real **DIF** |
| 9 | Descripción comercial | Obligatoria | **1C** | `products.description` NOT NULL |
| 10 | Descripción técnica | Opcional | **1C** | `products.technical_description` nullable |
| 11 | Estado activo/inactivo/descontinuado | Enum en tabla | **1C** | `status in ('active','inactive','discontinued')`; sin borrado físico |
| 12 | Impuestos | Solo referencia fiscal | **DISEÑO** | Columna `tax_rate`/`tax_profile_id` diferida hasta fase fiscal; se documenta en el modelo |
| 13 | Precio base o separación futura | Precios de **referencia** en variante | **1C** | `reference_price_unit/box/m2` nullable (dato Intelisis); **listas de precios/precios por sucursal DIFERIDAS** (fase comercial) |
| 14 | Imágenes y documentos técnicos | Diferidos (Storage) | **DIF** | Requiere Supabase Storage (deshabilitado); solo diseño de `product_assets` en el modelo |
| 15 | Sustitutos o relacionados | Diferidos | **DIF** | `product_relations` diferida a fase comercial |
| 16 | Alcance por organización | Todo org-scoped | **1C** | `organization_id` en todas las tablas; RLS deny-by-default |
| 17 | Visibilidad por sucursal | Org-wide en 1C | **DIF** | `product_branch_visibility` diferida; en 1C el catálogo es visible a todas las sucursales de la org (`10-arch/07`) |
| 18 | Auditoría de cambios | Append-only en `_audit` | **1C** | `_audit.catalog_events` en subfase 1C.5 (create/update/archive de catálogo) |

---

## Decisiones explícitas (D-C01 … D-C17)

Ver detalle por decisión en `F1C_KICKOFF_CONTRACT.md` y `F1C_DATA_MODEL_PROPOSAL.md`.
Resumen de tensiones resueltas:

- **Jerárquico vs. plano (D-C01):** jerárquico con límite de 3 niveles. Suficiente
  para filtrado comercial sin introducir un árbol general infinito.
- **Producto/variante (D-C02):** separados. El modelo plano de `10-arch/14` mezclaba
  presentación y producto; inventario y ventas futuras consumen presentaciones.
- **SKU (D-C03):** en la variante. Un producto puede tener varias presentaciones
  (caja, pieza, m²) con SKU distintos.
- **Barcodes (D-C04):** múltiples. Mismo producto envasado con distintos códigos de
  barras según proveedor/Intelisis.
- **Unidades (D-C05):** base vs. venta con un factor simple (piezas por unidad de
  venta). La tabla de conversiones generales se difiere para no sobremodelar.
- **Precios (D-C06):** referencia en variante ahora (dato, no regla de negocio);
  precios efectivos, listas y precios por sucursal en fase comercial.
- **Global vs. org (D-C07):** org-scoped en todas las tablas de 1C. La vía global
  compartida se descarta en 1C por simplicidad RLS y aislamiento.
- **Cruces (D-C08):** RLS `using (organization_id = any(_access.current_organization_ids()))`
  + FK compuestas `(organization_id, id)` al estilo 1B.2 D03. Imposible referenciar
  un producto de otra organización.
- **Permisos (D-C09):** `catalog.read/create/update/archive/manage` (ver matriz RLS).
- **Auditoría (D-C10):** `_audit.catalog_events` en 1C.5; append-only; actor
  `_access.current_user_id()`.
- **Intelisis (D-C11):** `external_id` único por org; matching por código exacto →
  referencia externa confirmada → manual (`20-int/28`). Sin sync en 1C.
- **Duplicados (D-C12):** índices únicos funcionales `upper(sku)`, `upper(barcode)`
  por org; `external_id` único parcial por org.
- **Obligatorios (D-C13):** ver modelo de datos (sección "Obligatoriedad").
- **Descontinuados (D-C14):** `status='discontinued'` conserva la fila; las
  referencias históricas siguen válidas; `catalog.archive` controla la transición.
- **Sucursal (D-C15):** diferida. En 1C no hay tabla de visibilidad por sucursal.
- **Sustitutos (D-C16):** diferidos.
- **Imágenes/fichas (D-C17):** diferidas (Storage).

## Reglas de consistencia heredadas de fases previas

- Ningún fallback silencioso demo→supabase (D031).
- No `service_role` en cliente (blindado por tests).
- `security definer` solo con whitelist y `SET search_path=''` (D15).
- Prefijos de permisos `catalog.*` alineados con la convención `{dominio}.{accion}`.
