# F1C — Slices de Implementación (Catálogo Maestro de Productos)
## Estado: 1C.1 COMPLETADO — decisiones bloqueadas; 1C.2 no iniciada

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

División de 1C en subfases entregables e incrementales. La subfase 1C.1 (cierre y
bloqueo de decisiones arquitectónicas) está **COMPLETADA**; 1C.2 (migración) **no
se ha iniciado**.

---

## Visión general

```
1C.1  Cierre y bloqueo de decisiones arquitectónicas  ← COMPLETADA
  ↓
1C.2  Migración SQL + seed + verificación DB   ← PENDIENTE (no iniciada)
  ↓
1C.3  Dominio y casos de uso (sin UI)
  ↓
1C.4  Permisos, repositorios supabase y tests de seguridad
  ↓
1C.5  Auditoría `_audit.catalog_events` + cierre
```

Cada slice: definición de terminado clara, sin UI hasta 1C.6 (diferido, si aplica),
repositorios demo + supabase **sin fallback silencioso** (D031).

## 1C.1 — Cierre y bloqueo de decisiones arquitectónicas (COMPLETADA)

- Revisión humana de los entregables F1C; las 5 preguntas abiertas resueltas.
- Decisiones D-C01…D-C17 registradas como **APPROVED** en `DECISION_LOG.md`.
- Modelo final congelado en `F1C_DATA_MODEL_PROPOSAL.md`; permisos/RLS en
  `F1C_RLS_PERMISSION_MATRIX.md`; plan de pruebas ajustado en `F1C_TEST_PLAN.md`.
- **Correcciones estructurales aprobadas:** `UNIQUE(organization_id, id)` en tablas
  padre; índices funcionales `upper(trim(...))`; `CHECK trim()<>''`; normalización
  de `external_id`; FK compuestas; RLS deny-by-default; trigger `_catalog.enforce_status_transition`
  para que `catalog.update` no ejecute `archive`.
- **Anexo operativo:** `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md` (evidencia
  comercial agosto 2026; promociones/precios temporales fuera de 1C).
- **Definición de terminado:** decisión humana registrada; documentos actualizados;
  solo cambios `.md`; `git diff --check` limpio.

## 1C.2 — Migración `00000000000008_product_master.sql` + seed (PENDIENTE)

- Crear esquema `_catalog` y las 7 tablas con RLS deny-by-default y políticas
  (sección 4 de `F1C_RLS_PERMISSION_MATRIX.md`).
- Índices únicos funcionales `upper(trim(...))`, `UNIQUE(organization_id, id)`,
  FK compuestas org-scoped, `CHECK trim()<>''`, triggers `_core.updated_at()`.
- Triggers `_catalog`: `enforce_category_tree`, `enforce_product_active_variant`,
  `enforce_last_active_variant`, `enforce_status_transition` (SECURITY INVOKER,
  `search_path=''`).
- Cargar permisos `catalog.*` y `role_permissions` (matriz de roles aprobada) en
  `seed.sql` + datos de prueba (sección 6 de `F1C_TEST_PLAN.md`).
- **Definición de terminado:** `npm run db:lint`, `npm run db:test`, `npm run db:verify`
  en verde; `npm run db:types` regenera `src/types/database.ts`.
- **No iniciada** hasta instrucción expresa.

## 1C.3 — Dominio y casos de uso (sin UI)

- `src/features/catalog/domain/**`: entidades (Product, Variant, Category, Brand,
  Unit, Line), reglas (producto nace `inactive`, ≥1 variante activa para activar,
  última variante activa protegida, baja lógica, `reference_price` único por
  `sale_unit_id`).
- `src/features/catalog/application/**`: use cases (create/update/archive/restore/query).
- Repositorios demo (`in-memory`) + contrato de interfaz.
- **Definición de terminado:** tests unit de dominio/use cases (patrón
  `src/tests/features/catalog/**`); `npm run test` en verde.

## 1C.4 — Repositorios Supabase, permisos y seguridad

- Repositorio `supabase` (RLS vía `authenticated`), selección por variable de
  entorno `CATALOG_DATA_SOURCE` con default `"demo"` y **error explícito** si la
  fuente falla (sin fallback silencioso; patrón `organization/repository-selection`).
- Registro de permisos `catalog.*` con `current_user_permissions()`.
- Tests: CA-31…CA-39 (aislamiento por org, deny-by-default), `admin-separation` y
  `feature-security` de catálogo.
- **Definición de terminado:** suite de seguridad 1C en verde + `npm run lint`/`typecheck`.

## 1C.5 — Auditoría y cierre

- Migración `_audit.catalog_events` (append-only, actor `_access.current_user_id()`).
- Poblado en create/update/archive de catálogo (patrón `_audit` de 1B).
- Verificación final: `npm run validate`, `npm run db:verify`, no-regresión E2E.
- **Definición de terminado:** cierre de 1C; commit de integración y handoff de 1D.

## Notas de secuenciación

- **1C.6 UI** (páginas de catálogo) no está en 1C; se propone como fase posterior.
- `documentos → Storage` (D-C17), `visibilidad por sucursal` (D-C15) y las entidades
  de **Comercialización** (campañas/promociones/outlet/incentivos — ver
  `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`) quedan fuera de 1C incluso al cierre.
- Ninguna subfase introduce `service_role` en cliente.
- No se modifica `seed.sql` hasta 1C.2 (prohibido en 1C.1).
