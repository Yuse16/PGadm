# F3 — Slices de Implementación (Layout — Fase 3)
## Estado: kickoff APROBADO — D-L01…D-L14 APPROVED (2026-08-08); 3.4 completada, 3.5 pendiente

**Fecha:** 2026-08-08
**Rama:** `feature/f3-PG-LAYOUT-006-layout`

División de F3 en subfases entregables e incrementales. Subfases 3.1 (kickoff +
paquete documental), 3.2 (migración SQL + seed), 3.3 (dominio y casos de uso) y
3.4 (repositorios supabase + seguridad) están **COMPLETADAS**; las subfases
restantes **no se inician** hasta aprobación humana e instrucción expresa.

---

## Visión general

```
3.1  Kickoff + paquete documental (modelo, RLS, test plan)  ← COMPLETADA
  ↓
3.2  Migración SQL + seed + verificación DB   ← COMPLETADA
  ↓
3.3  Dominio y casos de uso (layout, editor, versionado, posiciones, stock)  ← COMPLETADA
  ↓
3.4  Repositorios supabase, permisos y seguridad  ← COMPLETADA
  ↓
3.5  UI / editor (lienzo estructurado, capa base + stock tienda/CEDIS)  ← PENDIENTE
  ↓
3.6  Integración stock (port 1C.5/1D) + revisión por cambio + cierre
```

Cada slice: definición de terminado clara, repositorios demo + supabase **sin
fallback silencioso** (patrón D031/D-C22/D-I12/D-L11), sin `service_role` en cliente.

## 3.1 — Kickoff y paquete documental (COMPLETADA)

- `F3_KICKOFF_CONTRACT.md`: alcance, restricciones, D-L01…D-L14 APPROVED.
- `F3_DATA_MODEL_PROPOSAL.md`: candidato de 4 tablas + preguntas abiertas.
- `F3_RLS_PERMISSION_MATRIX.md`: permisos `layout.*` + políticas RLS.
- `F3_TEST_PLAN.md`: casos LA-1…LA-34 + no-regresión + seed.
- **Definición de terminado:** solo cambios `.md`; `git diff --check` limpio;
  decisiones registradas como APPROVED en `DECISION_LOG.md` (2026-08-08).

## 3.2 — Migración SQL + seed (COMPLETADA)

- Migración `supabase/migrations/00000000000011_layout.sql` con las tablas del modelo
  aprobado (4 tablas org-scoped + `_audit.layout_events`).
- RLS deny-by-default + políticas allowlist (sección 4 de `F3_RLS_PERMISSION_MATRIX.md`).
- FK compuestas org-scoped a `branches` (1B), `product_variants` (1C) y `profiles`;
  `UNIQUE(organization_id, id)` en tablas padre.
- `CHECK trim() <> ''`, triggers `_core.updated_at()`, sin DELETE, revokes mínimos.
- Cargar permisos `layout.*` y `role_permissions` (matriz D-L10) + fixtures demo
  (1 layout Nogalera draft v1, M1-01…M1-04, 14 elementos, 35 posiciones, 6 filas historial).
- Auditoría `_audit.layout_events` (patrón 1C.5/1D, D-L12).
- **Definición de terminado:** `npm run db:lint`, `npm run db:test`, `npm run db:verify`
  en verde; `npm run db:types` regenera `src/types/database.ts`.
- **Resultado:** commit `d4b5fa5`; `db:lint`/`db:test` (748 PASS)/`db:verify` en verde;
  asserts actualizados en `test_identity_rbac_rls.sql`, `test_inventory_stock.sql`,
  `test_organization_rls.sql`.

## 3.3 — Dominio y casos de uso (sin UI) (COMPLETADA)

- `src/features/layout/domain/**`: entidades (Layout, LayoutElement, LayoutPosition,
  LayoutVersionEntry), reglas (editar solo sobre draft, código permanente, no
  reasignar por stock, historial append-only, existencia reportada).
- `src/features/layout/application/**`: use cases (createLayout, addElement,
  moveElement, rotateElement, resizeElement, lockElement, hideElement, duplicateElement,
  assignProduct, removeProduct, publishLayout, restoreVersion, listPositionsWithStock,
  markNeedsReview, confirmReplacement).
- Repositorios demo (`in-memory`) + contrato de interfaz; selección
  `LAYOUT_DATA_SOURCE` con default `demo` y error tipado sin fallback silencioso
  (D-L11); stock como port de solo lectura (D-L13).
- **Definición de terminado:** tests unit de dominio/use cases
  (`src/tests/features/layout/**`); `npm run lint`/`npm run typecheck`/`npm run test`
  en verde.
- **Resultado:** commit `b808276`; 82 tests de layout, gates en verde.

## 3.4 — Repositorios Supabase, permisos y seguridad (COMPLETADA)

- Repositorio `supabase` (RLS vía `authenticated`), selección por variable de entorno
  `LAYOUT_DATA_SOURCE` con default `"demo"` y **error explícito** sin fallback
  silencioso (D-L11, patrón `repository-selection`).
- Registro de permisos `layout.*` con `current_user_permissions()`.
- Tests: LA-22…LA-28 (aislamiento por org, deny-by-default), `admin-separation` y
  `feature-security` de layout.
- **Definición de terminado:** suite de seguridad F3 en verde + `npm run lint`/`typecheck`.
- **Resultado:** `supabase-layout-{repository,reference-catalog,audit-repository,stock-provider}`
  RLS-scoped; `createLayoutContext("supabase")` funcional; `feature-security.test.ts`
  (6 tests) en verde; gates completos en verde.

## 3.5 — UI / editor (lienzo estructurado)

- Pantalla `/admin/layout`: lienzo editable con `background_reference` de fondo,
  elementos arrastrables (mover/rotar/redimensionar/bloquear/ocultar/duplicar),
  paleta de tipos de mueble/zonas, asignación de producto por búsqueda del catálogo 1C.
- Solo edición sobre `draft`; botones de publicar/restaurar según permisos
  (`current_user_permissions()`).
- Vista de posición: tocar un mueble muestra productos, stock tienda/CEDIS (existencia
  reportada con fecha), línea, precio, último cambio y alertas (D-L13).
- **Definición de terminado:** vitest de componentes + `npm run build`; navegación en
  desarrollo sin errores.

## 3.6 — Integración y cierre

- Poblar stock real de 1D en el port de 1C.5/1D (`getIntegrationSummary`) para el
  layout (reemplaza Noop si no se hizo antes).
- Detección de cambio de stock → `review_status='needs_review'` + sugerencia de
  reemplazo compatible (D-L07); confirmación del usuario.
- Verificación final: `npm run validate`, `npm run db:verify`, no-regresión E2E.
- **Definición de terminado:** cierre de F3; commit de integración y handoff de la
  siguiente fase (ventas y CRM, Fase 4).

## Notas de secuenciación

- Ventas/CRM/comercialización/IA quedan **fuera** de F3 (D-L09) — consumen layout en
  sus fases.
- La validación física (D-L14) se implementa como proceso asistido mínimo (registro de
  diferencias); fotografías diferidas por Storage (D-C17).
- `background_reference` se registra como URL/ref de texto; subir la imagen a Storage
  queda diferido (D-C17).
- Ninguna subfase introduce `service_role` en cliente.
- No se modifica `seed.sql` hasta 3.2 (prohibido en 3.1).
