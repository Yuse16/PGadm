# F1C — Anexo Operativo: Comercialización Agosto 2026
## Evidencia de negocio (no regla permanente del catálogo)

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Fuente:** `C:\Users\GVTASNOG\Desktop\COMERCIALIZACION AGOSTO 2026.pdf` (30.6 MB, 24 páginas)
**Extracción:** texto con `pypdf` (el PDF es predominantemente imagen; varias listas
son descargas externas).

> **Principio obligatorio:** el catálogo 1C **no** introduce campañas, descuentos
> temporales, colores de etiquetas, incentivos, precios mensuales ni reglas de
> Outlet como columnas permanentes de `products` o `product_variants`. 1C solo
> provee las referencias maestras (producto, variante, categoría/familia, marca,
> formato, unidades, SKU, barcode, `external_id`, estado) sobre las que esas
> campañas se aplicarán después.

---

## 1. Resumen de la comercialización de agosto 2026

La operación comercial de agosto 2026 define cómo se etiquetan y exhiben productos
en tienda y cómo se incentiva la venta. Puntos centrales del material:

- **Sistema de colores de etiquetas por tipo de promoción:** naranja, amarilla,
  roja, azul y dorada.
- **Promoción "6ta caja gratis"** en marcas Perdura Stone y Stein (comprando 5 cajas
  la 6.ª es gratis ≈ 20% adicional); etiqueta y destello **azul**.
- **Paquete Ahorres:** etiqueta **naranja**; 2 piezas = 20% de descuento adicional
  (o 1 pieza = 10%); paquetes especiales (muebles de cocina >50%, lambrín Castel).
- **Novedades PG:** productos nuevos de todas las familias; etiqueta **dorada**.
- **Outlet / Remates:** para inventario sin rotación (>180 días): remate tienda y
  remate CEDIS; etiqueta **roja**; descuentos adicionales 20%–50%.
- **Precios por formato** (pisos): promoción "Los precios más bajos"; etiqueta
  **amarilla** "Precio X Formato"; formatos 44x44/45x45 $179, 55x55 $214, 60x60
  $219, 60x120 $299–$349.
- **Descuentos por familia o marca del mes:** líneas con descuentos adicionales
  10%/20%/30%….
- **Material de exhibición:** posters, banners, destellos (descargables), acomodo
  de sanitarios en pasillo principal.
- **Incentivos internos de venta:** concurso de ventas (mayor a $50k → $2,000;
  $75k → $3,000; $100k → $5,000) solo de remates (excepto recubrimientos), sobre
  stock disponible en CEDIS y tienda.
- **Incentivos por categoría de compra:** Minisplit y Boiler — compras > $40k / $50k /
  $60k habilitan artículos PRI E 0002 / E 0003 / E 0004 (1 TON / 1.5 TON / 2 TON).

## 2. Matriz de requisitos observados

| ID | Requisito | Evidencia (pág.) | Dimensión |
|----|-----------|------------------|-----------|
| R-01 | Etiquetas por color según tipo de promoción (naranja/amarilla/roja/azul/dorada) | 2 | Comercialización |
| R-02 | Promoción "6ta caja gratis" (5+1) ≈ 20% adicional | 2, 21 | Comercialización |
| R-03 | Paquete Ahorres (2 piezas = 20%; 1 pieza = 10%) | 2, 14–16 | Comercialización |
| R-04 | Novedades PG por familia; etiqueta dorada | 2, 22 | Comercialización |
| R-05 | Zona Outlet: remate tienda y remate CEDIS; inventario >180 días | 2, 17–19 | Inventario + Comercialización |
| R-06 | Descuentos por línea/familia del mes (10%–50%) | 2, 18 | Comercialización |
| R-07 | Precios por formato (pisos); "Los precios más bajos" | 4–6 | Precios (diferido) |
| R-08 | Material de exhibición: posters, banners, destellos, acomodo | 3, 5, 9–10, 13 | Merchandising |
| R-09 | Incentivos internos de venta (concurso por monto) | 24 | Incentivos personal |
| R-10 | Incentivos por umbral de compra (Minisplit/Boiler) | 11–12 | Incentivos personal |
| R-11 | Etiquetas de Outlet hechas en Excel, no en Intelisis | 19 | Proceso (fuera de sistema) |
| R-12 | Productos que entran/salen de promoción (listas descargables) | 4, 6, 17, 22 | Comercialización (listas externas) |

## 3. Requisitos ya soportados por 1C (referencias maestras)

| Requisito | Soporte 1C |
|-----------|-----------|
| Identificar el producto/presentación exacta de cada promoción | `products.id`, `product_variants.id`, SKU, barcode, `external_id` |
| Agrupar por familia/categoría | `product_categories` (jerárquica) |
| Agrupar por marca (p. ej. Perdura Stone, Stein, Lamosa, Porcelanite, Vitromex, Renujal) | `product_brands` |
| Distinguir formato de la presentación (44x44, 60x60, 60x120…) | `product_variants.format` |
| Unidad base y unidad de venta para calcular caja/pieza | `base_unit_id`, `sale_unit_id`, `base_units_per_sale_unit` |
| Precio de referencia por formato | `reference_price` (dato, no regla) |
| Estado del producto (activo/inactivo/descontinuado) | `status` |
| Clasificar por línea de negocio (pisos, sanitarios, adhesivos…) | `product_lines` |

## 4. Requisitos diferidos a Comercialización (fuera de 1C)

- Definición y vigencia de campañas (6ta caja gratis, paquete ahorres, novedades).
- Reglas de descuento por familia/marca del mes (10%–50%).
- Colores y tipos de etiquetas (naranja/amarilla/roja/azul/dorada) y su regla de
  aplicación por producto.
- Productos que entran/salen de promoción (listas mensuales).
- Zona Outlet: qué productos entran (remate tienda / remate CEDIS).
- Montos de incentivos y reglas de los concursos.

## 5. Requisitos que dependen de Inventario

- Identificar inventario sin rotación (>180 días) para Outlet.
- Balanceo de stock CEDIS vs. tienda (remate CEDIS de producto no existente en tienda).
- Exhibición de remates con stock disponible (incl. escaleras para pisos).

## 6. Requisitos que dependen de precios / listas de precios

- Precios por formato (pisos) y su promoción "Los precios más bajos".
- Precio de lista vs. precio promoción en etiquetas editables.
- Descuento adicional efectivo (20%, 10%, 30–50%) aplicado sobre el precio de venta.
- La etiqueta de Outlet se genera en Excel (fuera del sistema; requerirá validación
  si se digitaliza después).

## 7. Requisitos que pertenecen a incentivos del personal

- Concurso de ventas por monto (>$50k→$2,000; >$75k→$3,000; >$100k→$5,000).
- Concurso limitado a ventas de remates (excepto recubrimientos) sobre stock
  disponible CEDIS/tienda.
- Incentivos por umbral de compra en Minisplit/Boiler (regalos PRI E 0002–E 0004).

## 8. Propuesta preliminar de entidades futuras (Comercialización)

> Solo diseño conceptual; **no** se crean migraciones ni código.

| Entidad | Propósito | Relaciones |
|---------|-----------|-----------|
| `commercial_campaigns` | Campaña con nombre, vigencia, tipo (6ta caja, paquete ahorres, novedades, formatos) | → org; → `campaign_products` |
| `promotion_rules` | Regla de descuento (20%, 30%, 5+1, 2x1…) con prioridad y vigencia | → org; → `campaign_products` |
| `campaign_products` | Productos/variantes que entran o salen de una campaña con su regla | → `commercial_campaigns`, `product_variants` |
| `promotion_bundles` | Paquetes armados (2 piezas, muebles de cocina, lambrín Castel) | → org; → `campaign_products`/variantes |
| `campaign_labels` | Definición de etiquetas por color (naranja/amarilla/roja/azul/dorada) y destellos | → org; → `campaign_products` |
| `store_merchandising_tasks` | Acomodo, posters, banners, destellos y lineamientos de exhibición por tienda | → org/branch; → campañas |
| `outlet_rules` | Reglas de Outlet/remate (tienda vs. CEDIS, umbral de días, rangos de descuento) | → org; → inventario (depende) |
| `sales_incentives` | Incentivos y concursos de venta (montos, premios, elegibilidad) | → org; → usuarios/ventas |

Dependencias: `outlet_rules` requiere inventario (días de rotación, stock); las
reglas de precio requieren listas de precios; `sales_incentives` requiere ventas.

## 9. Riesgos, contradicciones o información que requiere validación humana

| Ítem | Detalle |
|------|---------|
| PDF basado en imágenes | Gran parte del texto (págs. 6, 20 y listas de productos) no se extrajo; el análisis se basa en el texto legible (24 páginas) |
| Listas externas | Los productos concretos (precios por formato, paquete ahorres, remate, novedades) son descargas vinculadas (AQUI); no disponibles en el PDF |
| Umbrales Minisplit/Boiler | Págs. 11–12 muestran el mismo texto (compras >$40k/50k/60k → PRI E 0002–E 0004); puede ser copia o error real |
| `DURANGO` (pág. 23) | Imagen sin texto; sin contexto (¿sucursal, campaña o producto?) |
| `Monedero` (pág. 2) | Mencionado como línea junto a PAQUETE AHORRES/OUTLET, sin detalle en el texto extraído |
| Etiquetas en Excel | La etiqueta de Outlet se genera en Excel y no vía Intelisis (pág. 19); si se digitaliza, requerirá flujo propio |
| Temporales vs. permanentes | Todos los colores/descuentos/incentivos son del mes; no deben modelarse como columnas fijas del catálogo (principio del anexo) |

**Acción recomendada:** validar los ítems anteriores con el área comercial antes de
diseñar las entidades de Comercialización (sección 8).
