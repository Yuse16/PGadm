# F3 — Kickoff Contract: Layout (Fase 3 — Plano estructurado, editor, M1 y stock)

**Fecha:** 2026-08-08
**Fase:** Fase 3 — Layout (`docs/orchestration/phases/06_PHASE_6.md`; roadmap
`17-roadmap/02_PROJECT_PHASES.md`)
**Rama:** `feature/f3-PG-LAYOUT-006-layout`
**Base:** `develop` `2e1291e` (merge PR #11, cierre documental 1C+1D)
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\layout-kickoff`
**Estado:** Documento de arranque — **kickoff contract**. No es implementación. Las
decisiones D-L01…D-L14 son **PROPUESTAS** y quedan **PENDIENTES de revisión humana**
antes de cualquier migración, código o UI (metodología: no iniciar subfases de
implementación sin instrucción expresa).

---

## 1. Principio rector

El layout es un **mapa interactivo editable, no una imagen** (`02-layout/LAYOUT_SYSTEM.md`).
Convierte el plano de Canva de la tienda Nogalera en elementos estructurados y
editables; al tocar una ubicación se muestran productos, stock tienda/CEDIS, línea,
precio, ficha, historial y recomendaciones. Depende de **catálogo maestro (1C)** y
**sucursales (1B)** y **consume inventario (1D)** (D-I14): las posiciones del layout
referencian el mismo producto exacto vía `variant_id` org-scoped (criterio 7 de
`F1C_KICKOFF_CONTRACT.md`).

El gate de salida de la fase (`06_PHASE_6.md`): **"M1 muestra producto, posición y
existencia."**

## 2. Objetivo de la fase

Crear el plano estructurado de la tienda (editor, muebles, posiciones, versiones),
cargar los cuatro M1 con sus rieles y posiciones, publicar la versión 1 desde el
plano de Canva como referencia, y mostrar en cada ubicación el stock tienda/CEDIS
reportado por 1D — **sin que el layout modifique jamás el inventario**.

### Qué pertenece a F3 (alcance propuesto)

1. **Plano estructurado**: layout por tienda, org-scoped; la imagen de Canva se
   conserva como `background_reference` (referencia visual), el modelo es de
   elementos editables (`21-migration/23_LAYOUT_MIGRATION.md`).
2. **Elementos (muebles/zonas)**: tipos de mueble y zonas de la tienda Nogalera
   (grifería, galerías Vitromex/Lamosa/Porcelanite, outlet, muros
   Vitromex/Tendenzza/Castel, cuatro M1, escaleras, MPB, parrillas y campanas, baños
   Cato/Helvex, vanities, mostrador, bodega de válvulas, caja, baños, ambientes y
   entradas; `02-layout/STORE_LAYOUT_NOGALERA.md`).
3. **IDs de ubicación permanentes**: jerárquicos y únicos (ej.
   `M1-01-CARA-A-RF-B02-P03`); el elemento tiene `code` permanente y la posición
   `position_code` (`02-layout/LOCATION_ID_SYSTEM.md`).
4. **Editor**: agregar, mover, rotar, redimensionar, bloquear, ocultar, duplicar
   elementos y asignar productos; cada cambio guarda usuario, fecha, hora, origen,
   destino y motivo (`02-layout/LAYOUT_EDITING_RULES.md`).
5. **Geometría normalizada**: coordenadas relativas/unidades lógicas del lienzo
   (0–1), sin píxeles absolutos; escala, zoom, paneo, proporción, rotación y capas
   (`10-arch/18_LAYOUT_GEOMETRY.md`).
6. **Versionado**: estados `draft`/`published`/`archived`; editar siempre sobre
   borrador, publicar con aprobación, conservar la versión anterior, permitir
   restauración y no perder posiciones históricas
   (`10-arch/19_LAYOUT_VERSIONING.md`).
7. **Cuatro M1** (M1-01…M1-04): riel frontal (3 posiciones recomendadas), riel
   intermedio (3), riel posterior (2), bastidor portamuestras y posiciones de
   exhibición; capacidad confirmada por mueble y proveedor
   (`02-layout/FURNITURE_M1.md`, `24-master-index/09_M1_CONSOLIDATED_RULES.md`,
   `21-migration/25_M1_INITIAL_SETUP.md`).
8. **Asignación de productos**: posición referencia `variant_id` del catálogo 1C con
   `active_from`/`active_to`; el historial por posición conserva el producto actual y
   los anteriores con fechas y motivos (`10-arch/17_LAYOUT_DATA_MODEL.md`).
9. **Stock en layout**: al tocar una ubicación se muestra stock tienda y CEDIS
   (existencia reportada, con fecha, separados) usando snapshots/cambios de 1D; un
   cambio de inventario **marca la posición para revisión y sugiere reemplazo
   compatible, esperando confirmación** — nunca reasigna automáticamente
   (`05-inventory/20_LAYOUT_INTEGRATION.md`).
10. **Auditoría**: eventos de layout en `_audit.layout_events` (creación de layout,
    cambio de elemento, asignación de producto, publicación, restauración; patrón
    `_audit` de 1C.5/1D) (`23-contracts/43_INVENTORY_LAYOUT_EVENTS.md`).
11. **Preparación de la validación física** (recorrido: confirmar ubicación, tipo,
    orientación, dimensiones, código, productos; registrar diferencias; aprobadores
    gerente/comercial) como proceso asistido (`21-migration/24_LAYOUT_PHYSICAL_VALIDATION.md`).

### Qué NO pertenece a F3 (diferido, por diseño)

- Layout de CEDIS u otras sucursales (solo tienda Nogalera como versión 1; SAL se
  replica con el mismo modelo en fase posterior).
- Fotografías de ubicaciones/productos como evidencia (Supabase Storage deshabilitado;
  hereda D-C17; se registra la diferencia textual).
- Capas de comercialización, ventas, alertas, mantenimiento e IA como módulos
  completos (el layout solo muestra capa base + stock tienda/CEDIS; las demás capas
  son fases posteriores: `02-layout/LAYOUT_SYSTEM.md`).
- Recomendaciones de IA, señal de demanda y sugerencias inteligentes (fase 8).
- Escritura sobre inventario desde el layout (prohibido; el layout nunca muta stock,
  precios ni observaciones).
- Migración completa del plano de Canva a elementos: la versión 1 cubre las zonas
  principales y los cuatro M1 como seed de referencia; el resto se carga
  incrementalmente por validación física.
- Editor de imágenes/vectorial avanzado ni impresión automática del plano a escala.
- Búsqueda, fichas de producto detalladas y fotos (1C las provee; el layout solo las
  enlaza).

## 3. Restricciones de la fase

- No trabajar directamente sobre `develop`; no merge, no PR, no push sin orden.
- No reutilizar worktrees de otras ramas; mantener `layout-kickoff` aislado.
- No eliminar ramas ni worktrees anteriores.
- Multitenencia estricta: layout org-scoped, RLS deny-by-default reutilizando
  `_access` (004) y el patrón 007; `organization_id` nunca se confía del cliente.
- `service_role` **nunca** en cliente (blindado por `feature-security`).
- Repositorios demo + supabase **sin fallback silencioso** (patrón D031/D-C22/D-I12);
  propuesta: `LAYOUT_DATA_SOURCE=demo` default | `supabase`.
- Conservar arquitectura `domain/application/infrastructure` (patrón `catalog`/`inventory`).
- No inventar stock, precios, códigos, líneas, acuerdos, fechas ni responsables.
- Stock presentado como "existencia reportada" con fecha; tienda y CEDIS separados
  (heredado de 1D); sin causa de movimiento.
- Un cambio de inventario **nunca** cambia automáticamente el producto de una
  posición; marca para revisión y espera confirmación.
- No borrar historial de posiciones ni versiones (append-only).
- Capacidades de M1 (3/3/2 observadas) son **recomendadas**, no regla dura: se
  confirman por mueble y proveedor antes de imponer restricciones.
- Geometría normalizada; evitar depender de píxeles absolutos.

## 4. Decisiones propuestas (D-L01…D-L14) — PENDIENTES de aprobación humana

| ID | Propuesta | Fuente | Estado |
|----|-----------|--------|--------|
| D-L01 | Modelo de 4 tablas org-scoped (nombres plurales, consistencia repo): `layouts`, `layout_elements`, `layout_positions`, `layout_version_history`; layout scoped por organización y por tienda | `23-contracts/30_LAYOUT_SCHEMA.md`, `10-arch/17_LAYOUT_DATA_MODEL.md` | **PENDIENTE** |
| D-L02 | IDs de ubicación permanentes jerárquicos: `element.code` (ej. `M1-01`, `GAL-LAMOSA-01`) + `position_code` (ej. `CARA-A-RF-B02-P03`); el ID completo nunca cambia | `02-layout/LOCATION_ID_SYSTEM.md` | **PENDIENTE** |
| D-L03 | Geometría normalizada (0–1 / unidades lógicas de lienzo) con escala, zoom, paneo, rotación, `z_index` y capas; sin píxeles absolutos | `10-arch/18_LAYOUT_GEOMETRY.md` | **PENDIENTE** |
| D-L04 | Versionado `draft`/`published`/`archived`: editar sobre borrador, publicar con aprobación, conservar versión anterior y restaurar | `10-arch/19_LAYOUT_VERSIONING.md` | **PENDIENTE** |
| D-L05 | Plano de Canva como `background_reference` (referencia visual); el layout final es estructurado; la imagen no es el modelo y no se parsea | `21-migration/23_LAYOUT_MIGRATION.md` | **PENDIENTE** |
| D-L06 | Posición referencia `variant_id` del catálogo (1C) con `active_from`/`active_to`; posición puede quedar vacía; historial de posición append-only | `10-arch/17_LAYOUT_DATA_MODEL.md`, `05-inventory/20_LAYOUT_INTEGRATION.md` | **PENDIENTE** |
| D-L07 | Cambio de stock **marca** la posición para revisión y sugiere reemplazo compatible; espera confirmación; nunca reasigna automáticamente | `05-inventory/20_LAYOUT_INTEGRATION.md` | **PENDIENTE** |
| D-L08 | Cuatro M1 (M1-01…M1-04) con riel frontal/intermedio/posterior, bastidor y posiciones; capacidades 3/3/2 como recomendación confirmable por mueble/proveedor | `02-layout/FURNITURE_M1.md`, `24-master-index/09_M1_CONSOLIDATED_RULES.md`, `21-migration/25_M1_INITIAL_SETUP.md` | **PENDIENTE** |
| D-L09 | Tipos de mueble/zonas como catálogo de elementos (`element_type` + reglas de composición: vanities = paquete completo, ambientes sin huecos, galerías/muros por proveedor, escaleras ~10 posiciones); zonas de Nogalera como seed de referencia | `02-layout/STORE_LAYOUT_NOGALERA.md`, `02-layout/FURNITURE_*.md` | **PENDIENTE** |
| D-L10 | Permisos `layout.*` (`read`/`edit`/`publish`/`manage`) mapeados a los roles existentes (administrator/manager/cashier/operator) según matriz a validar con negocio; sin roles nuevos en F3 | patrón 1D (`F1D_RLS_PERMISSION_MATRIX.md`), `F1B3_RBAC_MATRIX_DRAFT.md` | **PENDIENTE** |
| D-L11 | `LAYOUT_DATA_SOURCE` = `demo` default \| `supabase`, sin fallback silencioso (extiende D031/D-C22/D-I12) | patrón 1C.3/`repository-selection` | **PENDIENTE** |
| D-L12 | Auditoría en `_audit.layout_events`: creación de layout, cambio de elemento, asignación de producto, publicación, restauración (patrón `_audit` 1C.5/1D) | `23-contracts/43_INVENTORY_LAYOUT_EVENTS.md`, D-C10/D-C18 | **PENDIENTE** |
| D-L13 | El layout consume inventario de 1D (snapshots/cambios con fecha) para mostrar stock tienda/CEDIS por posición; el port de integración de 1C.5/1D se reutiliza (stock real, no mock) | `05-inventory/20_LAYOUT_INTEGRATION.md`, D-I14 | **PENDIENTE** |
| D-L14 | La validación física queda como proceso asistido (recorrido y registro de diferencias; aprobadores gerente/comercial); fotografías diferidas por Storage (D-C17) | `21-migration/24_LAYOUT_PHYSICAL_VALIDATION.md` | **PENDIENTE** |

> Nota de nomenclatura (solicita confirmación): se propone rama `feature/f3-PG-LAYOUT-006-layout`
> (f3 = Fase 3 del roadmap; 006 = siguiente número de feature). La serie previa usó
> `f1c`/`f1d` para roadmap Fase 2; si se prefiere continuar `f1e`, es renombrable antes
> del primer push.

## 5. Criterios de éxito (derivados del gate de fase y `23-contracts/15_LAYOUT_ENDPOINTS.md`)

1. Crea un layout por tienda (org-scoped) con elementos editables y la imagen de
   Canva como referencia.
2. Cada ubicación tiene **ID permanente** jerárquico (`M1-01-CARA-A-RF-B02-P03`).
3. El editor permite agregar, mover, rotar, redimensionar, bloquear, ocultar,
   duplicar y asignar productos, registrando usuario/fecha/origen/destino/motivo.
4. Existen los **cuatro M1** con rieles, bastidor y posiciones (capacidad confirmada
   por mueble/proveedor).
5. Se publica la **versión 1** desde el plano de Canva como referencia; la imagen no
   es el modelo.
6. Al tocar una ubicación se muestra: productos, stock tienda y CEDIS (existencia
   reportada con fecha), línea, precio, último cambio, alertas.
7. Un cambio de inventario marca la posición para revisión y sugiere reemplazo
   compatible; **no** reasigna automáticamente.
8. El historial por posición conserva producto actual y anteriores con fechas y
   motivos; no se borra.
9. Publicación con aprobación; versión anterior conservada; restauración posible.
10. Auditoría de eventos de layout en `_audit.layout_events`.
11. Los módulos futuros (ventas, comercialización, reportes) pueden consumir el
    layout org-scoped por ubicación y `variant_id`.
12. Todos los gates: lint, typecheck, vitest, build, `db:reset`, `db:test`, `db:lint`,
    `db:verify`, `e2e:auth`, `e2e:identity` y los nuevos de F3.

## 6. Próximos pasos

1. **Revisión humana del kickoff contract** (D-L01…D-L14): aprobar, ajustar o diferir.
2. Tras aprobación y con instrucción expresa, generar el paquete documental de F3
   (data model proposal, RLS/permisos, test plan, slices) y luego la subfase de
   migración + seed + verificación DB.
3. No se crea ninguna migración (siguiente número libre de la secuencia) ni código
   hasta esa aprobación.
