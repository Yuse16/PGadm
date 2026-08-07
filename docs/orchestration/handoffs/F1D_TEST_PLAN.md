# F1D — Plan de Pruebas (Inventario — Fase 2)
## Estado: PROPUESTA — pendiente de revisión humana (D-I01…D-I14)

**Fecha:** 2026-08-06
**Rama:** `feature/f1d-PG-INVENTORY-005-inventory`

Plan de pruebas de la fase 1D. Se ejecutará cuando exista implementación (subfases
1D.2+); aquí se define el alcance para validar. Cobertura derivada de
`16-qa/14_INVENTORY_IMPORT_TESTS.md`, `05-inventory/32_ACCEPTANCE_CRITERIA.md`,
`25_DATA_VALIDATION.md`, `16_CHANGE_DETECTION.md`, `22_INVENTORY_BASELINE.md`.

---

## 1. Comandos de validación (heredados)

| Comando | Objetivo |
|---------|----------|
| `npm run lint` | ESLint en `src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` (unit + RSC tests bajo `src/tests/`) |
| `npm run db:lint` | reglas de seguridad/RLS de Supabase (`supabase db lint`) |
| `npm run db:test` | tests SQL de la base (pgTAP) |
| `npm run db:verify` | `scripts/verify-db.mjs` (chequeo de estado DB) |
| `npm run e2e:identity` / `e2e:auth` | flujos E2E existentes (sin regresión) |

## 2. Casos de importación (de `16-qa/14_INVENTORY_IMPORT_TESTS.md`)

- IA-1: archivo correcto → importa y muestra resumen (procesados/nuevos/modificados/
  sin cambios/errores/almacenes).
- IA-2: hoja incorrecta → error explicando la hoja esperada.
- IA-3: columna faltante (requerida: código/descripción/almacén/existencia) → no se
  importa silenciosamente; error por campo (fila, campo, valor, motivo, acción).
- IA-4: código duplicado → reportado como duplicado; no se suman filas
  automáticamente.
- IA-5: almacén desconocido → error; sugiere vincular/vincular existente.
- IA-6: cantidad no numérica → fila rechazada con motivo.
- IA-7: producto ausente del catálogo 1C → fila rechazada (no se inventa producto).
- IA-8: archivo repetido (misma fuente/fecha/almacén) → rechazado por unicidad.
- IA-9: archivo grande → límite/lote documentado; sin timeout silencioso.
- IA-10: interrupción → no queda snapshot parcial aprobado.
- IA-11: reintento → idempotente; no duplica snapshots/cambios.

## 3. Casos de snapshot y línea base

- IA-12: aprobar línea base crea `inventory_snapshot` `is_baseline=true` con la
  **fecha exacta de la fuente** (`report_date`) y los items.
- IA-13: no se calculan cambios **antes** de aprobar la línea base.
- IA-14: una segunda carga aprobada crea snapshot nuevo y `inventory_change` solo para
  variantes cuyo valor cambió (aumento/disminución/sin stock/recuperó stock/nuevo/
  ausente).
- IA-15: variante sin cambio en la segunda carga → **sin** `inventory_change`.
- IA-16: producto ausente del archivo en la segunda carga → `change_type='missing_product'`,
  **no** se asigna stock cero automáticamente.
- IA-17: el historial no se borra al cargar un nuevo Excel (snapshots y cambios previos
  permanecen).
- IA-18: `difference` = `new_quantity - previous_quantity` (generado), signo correcto.
- IA-19: unicidad `(snapshot_id, variant_id)` en items; `(source_snapshot_id,
  variant_id, warehouse_id)` en cambios.

## 4. Casos de observaciones manuales

- IA-20: crear observación (conteo físico, daño, apartado, ubicación incorrecta,
  etiqueta faltante, diferencia) con actor/fecha/cantidad/comentario.
- IA-21: la observación **no** cambia la `quantity` del snapshot ni el stock oficial.
- IA-22: confirmar/cerrar observación requiere `inventory.approve`.

## 5. Casos de seguridad RLS (deny-by-default)

- IA-23: usuario sin `inventory.read` no ve filas de ninguna tabla de inventario.
- IA-24: usuario con `inventory.read` solo ve filas de sus organizaciones, nunca de otra org.
- IA-25: usuario sin `inventory.approve` no puede insertar snapshot (ni items ni cambios).
- IA-26: usuario sin `inventory.observe` no puede crear observación.
- IA-27: usuario con `inventory.observe` pero sin `inventory.read`... (matriz: observe
  no implica read si el negocio lo pide; propuesta: observe + read juntos).
- IA-28: fila insertada con `organization_id` ajeno → rechazada (FK compuestas + RLS).
- IA-29: `service_role`/admin: repos de inventario no usan admin client
  (`feature-security` de inventario).
- IA-30: `warehouse_id`/`variant_id` de otra org → rechazado por FK compuestas.

## 6. Casos de consistencia de datos y convenciones

- IA-31: permisos `inventory.*` existen en `permissions` y se asignan según la matriz
  propuesta (D-I10) en `seed.sql` (1D.2).
- IA-32: `updated_at` se actualiza vía trigger `_core.updated_at()`.
- IA-33: `CHECK trim() <> ''` en campos obligatorios (`source_file`, `note`, `name`).
- IA-34: sin DELETE físico en ninguna tabla de inventario (sin política + revoke).
- IA-35: auditoría de eventos de inventario (aprobar importación, observación,
  confirmación) con actor y timestamp, append-only (D-I02, patrón `_audit` 1C.5).
- IA-36: stock presentado como "Existencia reportada" con fecha; tienda y CEDIS
  separados (UI).
- IA-37: conversión cajas/m² solo con factores confirmados; si faltan, `boxes`/
  `square_meters` NULL (D-I09).

## 7. Pruebas de no-regresión

- Suite existente (`src/tests/**`, organization/identity/catalog) en verde.
- `npm run lint`, `npm run typecheck`, `npm run db:verify` en verde.
- `e2e:auth` 14/14 y `e2e:identity` 39/39 sin regresión.
- No aparecen dependencias nuevas no justificadas en `package.json`.

## 8. Datos de prueba planificados (seed 1D.2, propuesta)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Almacenes | 2 | NOG-01 (store_backroom), SAL-01 (distribution) — existentes 1B.2 |
| Variantes del catálogo 1C | 3 | reutilizar fixtures demo PGM (TUB-PVC-100, VAL-GLOBO-050, …) |
| Snapshots | 2 | línea base + carga posterior |
| Snapshot items | 4–6 | variantes con existencias distintas |
| Cambios | 2–3 | increase/diminish + missing_product |
| Observaciones | 1–2 | conteo físico + daño |
| Permisos `inventory.*` | 4 | read/import/approve/observe (total permisos 15) |

Los datos demo quedan aislados por org (PGM y PGM-DEMO-B) — sin datos globales.

## 9. Criterio de salida

- Aprobación humana del kickoff y del modelo (D-I01…D-I14) registrada en
  `DECISION_LOG.md`.
- Casos IA-1…IA-37 diseñados y trazables a decisiones D-I01…D-I14.
- Línea base de `npm run validate` y `db:*` documentada (a ejecutar en 1D.2+).
