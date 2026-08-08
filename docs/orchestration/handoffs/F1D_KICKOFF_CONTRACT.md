# F1D — Kickoff Contract: Inventario (Fase 2 — Productos e inventario)
## Estado: APROBADO por revisión humana — D-I01…D-I14 registradas en DECISION_LOG (2026-08-06)

**Fecha:** 2026-08-06
**Fase:** Fase 2 — Productos e inventario (`docs/orchestration/phases/05_PHASE_5.md`)
**Rama:** `feature/f1d-PG-INVENTORY-005-inventory`
**Base:** `ee761b1` (HEAD de `feature/f1c-PG-CATALOG-004-product-master`; el inventario
depende del catálogo maestro 1C, aún sin merge a `develop`)
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\inventory-snapshots`
**Estado:** Documento de arranque — **kickoff contract**. No es implementación. Las
decisiones D-I01…D-I14 son **PROPUESTAS** y quedan **PENDIENTES de revisión humana**
antes de cualquier migración, código o UI (metodología: no iniciar subfases de
implementación sin instrucción expresa).

---

## 1. Principio rector

Intelisis es la **fuente oficial**; el cubo y el Excel conectado son fuentes de
consulta derivadas (`05-inventory/00_OVERVIEW.md`). La PWA da a la aplicación una
fuente confiable de inventario para tienda y CEDIS, mantiene historial de cambios y
alimenta ventas, layout, comercialización, balanceos y recomendaciones de IA. El
inventario depende de **catálogo maestro (1C)** y **almacenes (1B.2)** (`17-roadmap/05_DEPENDENCY_MAP.md`):
los módulos futuros referencian el mismo producto exacto vía `product_id`/`variant_id`
org-scoped (criterio 7 de `F1C_KICKOFF_CONTRACT.md`).

**Reglas de honestidad de datos** (`24-master-index/10_INVENTORY_CONSOLIDATED_RULES.md`):
- Stock tienda y CEDIS se muestran **separados**.
- Cada dato muestra **fecha**.
- Cada carga crea **snapshot**; los cambios se comparan entre snapshots.
- Sin cubo de movimientos, **no se atribuye causa**.
- **Existencia reportada ≠ disponibilidad garantizada.**

## 2. Objetivo de la fase

Gate de salida de la fase (`05_PHASE_5.md`): **"Archivo válido crea snapshot auditable."**

Importar inventario desde el Excel conectado al cubo (ruta inicial), detectar
almacenes, seleccionar tienda y CEDIS, mostrar existencia reportada por producto con
fecha, guardar solo cambios, conservar historial no destructivo, registrar
observaciones manuales sin alterar el valor oficial y preparar la futura conexión
autorizada con Intelisis (`05-inventory/00_OVERVIEW.md`).

### Qué pertenece a 1D (alcance propuesto)

1. Importación validada de inventario desde archivo (pipeline: carga, formato, hojas,
   encabezados, almacenes, normalización de códigos, validación de cantidades,
   selección tienda/CEDIS, comparación con carga anterior, persistencia, resumen;
   `05-inventory/13_IMPORT_PIPELINE.md`).
2. Mapeo de columnas configurable por plantilla (requeridos: código, descripción,
   almacén, existencia; `05-inventory/14_COLUMN_MAPPING.md`).
3. Selección de tienda principal y CEDIS relacionado con los almacenes detectados;
   **nunca mezclar existencias de otras sucursales**
   (`05-inventory/06_STORE_WAREHOUSE_SELECTION.md`).
4. **Snapshot auditable** por carga aprobada: `inventory_snapshot` conserva la
   fotografía lógica de la fuente; aprobar importación crea snapshot y eventos
   (`05-inventory/17/16`, `23-contracts/14_INVENTORY_ENDPOINTS.md`,
   `23-contracts/43_INVENTORY_LAYOUT_EVENTS.md`).
5. **Línea base**: primer snapshot aprobado; no calcular cambios antes de aprobarla
   (`21-migration/22_INVENTORY_BASELINE.md`).
6. **Detección de cambios** entre snapshots: guardar historial solo de productos cuyo
   valor cambió (aumento/disminución/sin stock/recuperó stock/nuevo/ausente;
   `05-inventory/16_CHANGE_DETECTION.md`).
7. **Historial por producto**: línea de tiempo, existencia por fecha, cambios, tienda,
   CEDIS, observaciones; **no se borra al cargar un nuevo Excel**
   (`05-inventory/17_INVENTORY_HISTORY.md`).
8. **Observaciones manuales** (conteo físico, daño, apartado, ubicación incorrecta,
   etiqueta faltante, diferencia) con usuario/fecha/cantidad/evidencia/comentario; **no
   cambian el stock oficial** (`05-inventory/24_MANUAL_ADJUSTMENTS.md`).
9. Vista tienda/CEDIS por producto: existencia total, cajas, piezas, m² estimados y
   última actualización (`05-inventory/10_STORE_CEDIS_VIEW.md`).
10. Metadatos de actualización: archivo, fecha/hora de carga, fecha interna del
    reporte, usuario, tienda, CEDIS, registros, estado, advertencias
    (`05-inventory/15_REFRESH_METADATA.md`).
11. Copia operativa del Excel (no modificar el original) con hojas limpias para la
    PWA (`05-inventory/05_WORKBOOK_CLONE.md`) — artefacto de operación, no de código.
12. Preparación de adaptadores de fuente para swap futuro
    (`ExcelInventoryDataSource`/`CubeInventoryDataSource`/`IntelisisSqlDataSource`/
    `IntelisisApiDataSource`; `05-inventory/28_FUTURE_DIRECT_INTEGRATION.md`).
13. Poblar el port de integración de 1C.5 (`CatalogIntegrationRepository.
    getIntegrationSummary()`: current/reserved/available stock) con datos reales de
    inventario.

### Qué NO pertenece a 1D (diferido, por diseño)

- Conexión directa autorizada a Intelisis/SQL Server/cubo (ruta futura; `01_INTELISIS_ENVIRONMENT.md`).
- Conector local automatizado (cubos Fase 3; `05-inventory/27_LOCAL_CONNECTOR.md`).
- Cubo de movimientos y clasificación de causa de movimiento (venta/recepción/balanceo/
  transferencia/ajuste/merma/devolución; `05-inventory/18_MOVEMENT_INFERENCE.md`).
- Campos de stock no confirmados (reservado/backorder/pendiente/dañado/en revisión):
  se muestran solo si la fuente los provee; nunca se descuentan por suposición
  (`05-inventory/09_STOCK_MODEL.md`).
- Layout, ventas, comercialización, balanceos, CEDIS-demand-signal y recomendaciones
  de IA (consumen inventario, fases posteriores; `05-inventory/20/21/22/23/29`).
- Cambiar el valor oficial del inventario desde la PWA (prohibido; `02_SOURCE_PRIORITY.md`).
- Precios, costos, proveedores, listas de precios (fases propias).
- Productos: 1D consume el catálogo 1C; **no** administra el maestro de productos.

## 3. Restricciones de la fase

- No trabajar directamente sobre `develop`; no merge, no PR, no push sin orden.
- No reutilizar worktrees de otras ramas; mantener `inventory-snapshots` aislado.
- No eliminar ramas ni worktrees anteriores.
- No modificar el archivo Excel original de la tienda (solo copia operativa).
- No escribir en Intelisis, no extraer credenciales, no leer memoria del proceso, no
  tocar SQL directo, no suplantar permisos de TI (`05-inventory/01_INTELISIS_ENVIRONMENT.md`).
- La PWA web **no** se conecta a IP interna desde internet (`05-inventory/27_LOCAL_CONNECTOR.md`).
- Multitenencia estricta: inventario org-scoped, RLS deny-by-default reutilizando
  `_access` (004) y el patrón 007; `organization_id` nunca se confía del cliente.
- `service_role` **nunca** en cliente (blindado por `feature-security`).
- Repositorios demo + supabase **sin fallback silencioso** (patrón D031/D-C22);
  propuesta: `INVENTORY_DATA_SOURCE=demo` default | `supabase`.
- Conservar arquitectura `domain/application/infrastructure` (patrón `catalog`).
- "Existencia reportada", nunca "Disponible real"; no declarar causas de movimiento sin
  cubo de movimientos.
- No calcular cambios antes de aprobar la línea base.
- Producto ausente del archivo → marcar ausente, **no** asignar stock cero
  automáticamente; solicitar revisión (`05-inventory/26_DUPLICATES_AND_MISSING.md`).
- No sumar duplicados automáticamente sin entender la estructura.
- Conversión de unidades solo con factores confirmados; mostrar unidad original y
  comercial (`05-inventory/11_UNITS_AND_CONVERSIONS.md`).
- Convertir/redondear a cajas completas solo cuando aplique.

## 4. Decisiones propuestas (D-I01…D-I14) — PENDIENTES de aprobación humana

| ID | Propuesta | Fuente | Estado |
|----|-----------|--------|--------|
| D-I01 | Modelo de 4 tablas org-scoped: `inventory_snapshot`, `inventory_snapshot_item`, `inventory_change`, `inventory_observation` (+ `import_template` opcional); snapshot = fotografía lógica, change = diferencia, observation = conteo/nota física | `23-contracts/29_INVENTORY_SCHEMA.md`, `10-arch/16_INVENTORY_DATA_MODEL.md`, `05-inventory/31_DATA_MODEL.md` | **PENDIENTE** |
| D-I02 | Aprobar importación crea snapshot + eventos (patrón `_audit`); el snapshot conserva la fecha exacta de la fuente | `23-contracts/14_INVENTORY_ENDPOINTS.md`, `43_INVENTORY_LAYOUT_EVENTS.md`, `21-migration/21_INVENTORY_INITIAL_LOAD.md` | **PENDIENTE** |
| D-I03 | Guardar solo cambios entre snapshots; el historial nunca se borra al cargar un nuevo Excel | `05-inventory/16_CHANGE_DETECTION.md`, `17_INVENTORY_HISTORY.md` | **PENDIENTE** |
| D-I04 | Stock presentado como "Existencia reportada" con fecha; tienda y CEDIS separados; sin causa de movimiento | `24-master-index/10_INVENTORY_CONSOLIDATED_RULES.md`, `05-inventory/09_STOCK_MODEL.md`, `18_MOVEMENT_INFERENCE.md` | **PENDIENTE** |
| D-I05 | Producto ausente del archivo → estado `ausente`, sin stock cero automático; requiere revisión | `05-inventory/26_DUPLICATES_AND_MISSING.md` | **PENDIENTE** |
| D-I06 | Observaciones manuales no mutan el stock oficial; se registran con actor, fecha, evidencia y comentario | `05-inventory/24_MANUAL_ADJUSTMENTS.md`, `02_SOURCE_PRIORITY.md` | **PENDIENTE** |
| D-I07 | Mapeo de columnas por plantilla por tipo de archivo; requeridos: código, descripción, almacén, existencia; sin import silencioso si falta un requerido | `05-inventory/14_COLUMN_MAPPING.md`, `25_DATA_VALIDATION.md` | **PENDIENTE** |
| D-I08 | Almacenes detectados en el archivo se vinculan a `warehouses` de 1B.2 (NOG-01/SAL-01) vía tienda/CEDIS; semilla inicial `116NOG-PGM` / `106SAL-PGM` | `05-inventory/06_STORE_WAREHOUSE_SELECTION.md`, migración 002 | **PENDIENTE** |
| D-I09 | Conversión de unidades solo con factores confirmados; mostrar unidad original + comercial; tabla general `product_units_conversion` (diferida en D-C05 → inventario) si se confirman factores | `05-inventory/11_UNITS_AND_CONVERSIONS.md`, `F1C_DATA_MODEL_PROPOSAL.md` §4 (D-C05) | **PENDIENTE** |
| D-I10 | Permisos `inventory.*` (read/import/approve/observe) mapeados a los roles existentes (administrator/manager/cashier/operator) sobre capacidades de `05-inventory/30_PERMISSIONS.md`; validar matriz final con negocio | `05-inventory/30_PERMISSIONS.md`, `F1B3_RBAC_MATRIX_DRAFT.md` (`inventory.import`) | **PENDIENTE** |
| D-I11 | Fuente inicial = Excel conectado al cubo; Intelisis como referencia oficial (valor nunca reemplazado); adaptadores de data source para swap futuro sin rehacer módulos | `05-inventory/00/02/28`, `01_INTELISIS_ENVIRONMENT.md` | **PENDIENTE** |
| D-I12 | `INVENTORY_DATA_SOURCE` = `demo` default \| `supabase`, sin fallback silencioso (extiende D031/D-C22) | patrón 1C.3/`repository-selection` | **PENDIENTE** |
| D-I13 | Alertas iniciales (tienda en cero con CEDIS con stock, stock bajo, exhibido sin stock, remate sin stock, nuevo con alto stock, diferencia entre cargas, ausente) con umbrales configurables por uso real | `05-inventory/19_STOCK_ALERTS.md` | **PENDIENTE** |
| D-I14 | Relación con layout/ventas/comercialización/CEDIS/IA diferida: inventario expone snapshots, cambios y observaciones con fecha para que esos módulos los consuman; el port de integración de 1C.5 se puebla con stock real | `05-inventory/20/21/22/23/29`, `F1C_KICKOFF_CONTRACT.md` criterio 7 | **PENDIENTE** |

Detalle, justificación y alternativas en el paquete de 1D (propuesto): `F1D_DATA_MODEL_PROPOSAL.md`,
`F1D_RLS_PERMISSION_MATRIX.md`, `F1D_TEST_PLAN.md`, `F1D_IMPLEMENTATION_SLICES.md`.

## 5. Criterios de éxito (derivados de `05-inventory/32_ACCEPTANCE_CRITERIA.md`)

1. Importa el Excel; detecta hojas, almacenes y columnas.
2. Permite seleccionar tienda y CEDIS sin mezclar existencias de otras sucursales.
3. Lee código, descripción y existencia; valida errores y explica qué importó y qué
   rechazó (fila, campo, valor, motivo, acción sugerida).
4. Guarda metadatos (archivo, fecha/hora, usuario, tienda, CEDIS, registros, estado).
5. Aprobar la línea base/importación crea un **snapshot auditable** con la fecha exacta
   de la fuente.
6. Compara contra la carga anterior y guarda **solo cambios**.
7. Muestra stock por tienda y CEDIS separados, con fecha, como **existencia reportada**.
8. Conserva el historial; no se borra al cargar un nuevo Excel.
9. No altera el valor oficial; las observaciones manuales quedan auditadas.
10. Los módulos futuros (ventas, layout, comercialización, balanceos) pueden consumir
    inventario org-scoped por `product_id`/`variant_id`.
11. Preparado para cambiar de fuente sin rehacer módulos (adaptadores).
12. Todos los gates: lint, typecheck, vitest, build, `db:reset`, `db:test`, `db:lint`,
    `db:verify`, `e2e:auth`, `e2e:identity` y los nuevos de 1D.

## 6. Próximos pasos

1. **Revisión humana del kickoff contract** (D-I01…D-I14): aprobar, ajustar o diferir.
2. Tras aprobación y con instrucción expresa, generar el paquete documental de 1D
   (data model proposal, RLS/permisos, test plan, slices) y luego la subfase 1D.2
   (migración + seed + verificación DB).
3. No se crea ninguna migración (siguiente número libre de la secuencia) ni código
   hasta esa aprobación.
