# F3 — Plan de Pruebas (Layout — Fase 3)
## Estado: candidato propuesto en kickoff; D-L01…D-L14 APPROVED 2026-08-08

**Fecha:** 2026-08-08
**Rama:** `feature/f3-PG-LAYOUT-006-layout`

Plan de pruebas de la fase F3. Se ejecutará cuando exista implementación (subfases
3.2+); aquí se define el alcance para validar. Cobertura derivada de
`02-layout/LAYOUT_SYSTEM.md`, `02-layout/LOCATION_ID_SYSTEM.md`,
`02-layout/LAYOUT_EDITING_RULES.md`, `10-arch/17/18/19` (data model, geometría,
versionado), `21-migration/23/24/25` (migración, validación física, M1) y
`05-inventory/20_LAYOUT_INTEGRATION.md`.

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

## 2. Casos de modelo de datos (de `10-arch/17`, `23-contracts/30`)

- LA-1: las 4 tablas (`layouts`, `layout_elements`, `layout_positions`,
  `layout_version_history`) existen org-scoped con `UNIQUE(organization_id, id)`.
- LA-2: `layouts` se ancla a una tienda (`branch_id`, `branch_type='store'`); FK
  compuesta `(organization_id, branch_id)` impide cruces de org.
- LA-3: código de elemento único por layout y org (`UNIQUE(organization_id, layout_id,
  code)`); `CHECK trim(code) <> ''`.
- LA-4: `position_code` único por elemento (`UNIQUE(organization_id, element_id,
  position_code)`).
- LA-5: `variant_id` de posición FK compuesta a `product_variants` (1C); NULL = vacía.
- LA-6: `status` restringido a `draft`/`published`/`archived`; `element_type` al
  catálogo de `02-layout/FURNITURE_*.md`.
- LA-7: `layout_version_history` append-only: sin políticas UPDATE/DELETE + REVOKE.

## 3. Casos de editor y geometría (de `LAYOUT_EDITING_RULES.md`, `10-arch/18`)

- LA-8: agregar/mover/rotar/redimensionar/bloquear/ocultar/duplicar elementos sobre un
  layout en `draft` persiste y registra usuario/fecha/origen/destino/motivo.
- LA-9: editar sobre un layout `published` está **bloqueado** (solo se puede sobre
  `draft`).
- LA-10: coordenadas normalizadas 0–1; sin píxeles absolutos; rotación y `z_index`
  persisten.
- LA-11: bloquear elemento (`locked=true`) impide mover/rotar/redimensionar vía
  use case.

## 4. Casos de versionado (de `10-arch/19`)

- LA-12: publicar `draft → published` requiere `layout.publish` y conserva la versión
  anterior en historial.
- LA-13: restaurar versión anterior crea evento `restored` y el layout vuelve a ese
  estado; no se borra la versión restaurada.
- LA-14: `archived` deja el layout fuera de consulta activa; el historial permanece.

## 5. Casos de M1 y posiciones (de `FURNITURE_M1.md`, `09_M1_CONSOLIDATED_RULES.md`)

- LA-15: existen cuatro M1 (M1-01…M1-04) en el seed con riel frontal/intermedio/
  posterior y bastidor.
- LA-16: capacidades 3/3/2 (frontal/intermedio/posterior) se almacenan como
  recomendación (`metadata`), no como CHECK; confirmable por mueble/proveedor.
- LA-17: asignar producto a posición persiste `variant_id` + `active_from`; asignar
  otro producto registra historial con `previous_variant_id`/`new_variant_id`.

## 6. Casos de integración con inventario (de `05-inventory/20_LAYOUT_INTEGRATION.md`)

- LA-18: al consultar una posición con producto se muestra stock tienda y CEDIS
  (existencia reportada con fecha, separados) desde 1D; nunca mock.
- LA-19: un cambio de stock detectado **marca** la posición `review_status='needs_review'`;
  **no** reasigna automáticamente el producto.
- LA-20: confirmar/sugerir reemplazo compatible espera acción del usuario; sin
  reasignación silenciosa.
- LA-21: el layout **no** escribe stock/precios/observaciones (solo lectura vía port
  de 1C.5/1D; prohibido UPDATE a tablas de inventario desde layout).

## 7. Casos de seguridad RLS (deny-by-default)

- LA-22: usuario sin `layout.read` no ve filas de ninguna tabla de layout.
- LA-23: usuario con `layout.read` solo ve filas de sus organizaciones, nunca de otra org.
- LA-24: usuario sin `layout.edit` no puede insertar/editar elementos ni posiciones.
- LA-25: usuario sin `layout.publish` no puede publicar (transición de status).
- LA-26: fila insertada con `organization_id`/`branch_id`/`variant_id` ajeno →
  rechazada (FK compuestas + RLS).
- LA-27: `service_role`/admin: repos de layout no usan admin client
  (`feature-security` de layout).
- LA-28: `layout_version_history` no admite UPDATE/DELETE por ningún rol.

## 8. Casos de consistencia de datos y convenciones

- LA-29: permisos `layout.*` existen en `permissions` y se asignan según la matriz
  propuesta (D-L10) en `seed.sql` (3.2).
- LA-30: `updated_at` se actualiza vía trigger `_core.updated_at()`.
- LA-31: `CHECK trim() <> ''` en campos obligatorios (`name`, `code`, `position_code`).
- LA-32: sin DELETE físico en ninguna tabla de layout (sin política + revoke).
- LA-33: auditoría de eventos de layout (`_audit.layout_events`) con actor y timestamp,
  append-only (D-L12, patrón `_audit` 1C.5/1D).
- LA-34: `LAYOUT_DATA_SOURCE=demo` (default) | `supabase`, sin fallback silencioso
  (D-L11); error tipado `RepositoryConfigurationError` sin configuración.

## 9. Pruebas de no-regresión

- Suite existente (`src/tests/**`, organization/identity/catalog/inventory) en verde.
- `npm run lint`, `npm run typecheck`, `npm run db:verify` en verde.
- `e2e:auth` 14/14 y `e2e:identity` 44/44 sin regresión.
- No aparecen dependencias nuevas no justificadas en `package.json`.

## 10. Datos de prueba planificados (seed 3.2, propuesta)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Tiendas | 1 | NOG-01 (branch store, existente 1B) |
| Layouts | 1 | versión draft "Nogalera" con `background_reference` |
| Elementos | ~12–16 | cuatro M1 + galerías/muros/escaleras/vanities/grifería/jacuzzis/boilers/mostrador/caja |
| Posiciones | ~30 | rieles M1 (3/3/2 ×4) + posiciones de zona |
| Variantes del catálogo 1C | 5–8 | reutilizar fixtures demo PGM (TUB-PVC-100, VAL-GLOBO-050, …) |
| Historial | 5–8 | created/product_assigned/product_removed/published/restored |
| Permisos `layout.*` | 4 | read/edit/publish/manage (total permisos 19) |

Los datos demo quedan aislados por org (PGM y PGM-DEMO-B) — sin datos globales.

## 11. Criterio de salida

- Aprobación humana del kickoff (D-L01…D-L14) registrada en `DECISION_LOG.md`.
- Casos LA-1…LA-34 diseñados y trazables a decisiones D-L01…D-L14.
- Línea base de `npm run validate` y `db:*` documentada (a ejecutar en 3.2+).
