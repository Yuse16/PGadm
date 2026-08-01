# HANDOFF — Phase 1B.2 (borrador)
## Organización, sucursales y almacenes

**Fecha:** 2026-07-31
**Estado:** Borrador de turno nocturno — sin commits, sin push, sin PR. Requiere revisión humana.

---

## 1. Resumen

Esquema SQL (organizaciones, sucursales, almacenes, relaciones tienda→almacén), seed de
fixtures demo idempotentes, contratos tipados de BD, dominio, aplicación, infraestructura,
UI admin de lectura y pruebas. Todo sobre `develop` (`1ea1246`) en el worktree de 1B.2.

## 2. Qué se implementó

- **Migración `00000000000002_organization_structure.sql`**: `organizations`, `branches`,
  `warehouses`, `branch_warehouse_relations`; FK compuestas, unicidades, CHECKs, triggers
  `updated_at`, revokes mínimos. PG15-safe.
- **Seed**: organización PGM, Nogalera (store), CEDIS Saltillo (distribution_center),
  almacenes NOG-01 y SAL-01 (primarios), relación `supply`. Idempotente (`ON CONFLICT`).
- **Tipos**: `src/types/database.ts` escrito manualmente (D19).
- **Dominio**: entidades, validadores (`assert*` con contexto), errores tipados.
- **Aplicación**: `getOrganizationStructure`, `listBranches`.
- **Infraestructura**: mappers + `SupabaseOrganizationRepository` (anon server, guard de configuración).
- **UI**: `/admin/organization` — tarjetas de sucursal, almacenes con badge principal, estados loading/vacío/error/configuración.
- **Pruebas**: 45 TS nuevas (79/79 total) + pgTAP `plan(66)` + sección 1B.2 en `ci_verify.sql`.

## 3. Decisiones clave (detalle en F1B2_DECISION_MATRIX.md)

- CEDIS = `branch_type 'distribution_center'` (D02).
- Almacén pertenece a sucursal con FK compuesta `(organization_id, branch_id)` (D03).
- Un principal por sucursal vía índice único parcial (D04).
- Códigos únicos por organización (D05); estados `text` + CHECK (D07); soft delete diferido (D08).
- Par `external_source`/`external_id` obligado con índice único global (D11/D12).
- RLS diferida a 1B.3; `organization_id` presente en todas las tablas de negocio ahora (D13).
- Usuarios/roles/permisos fuera de alcance (D14); repositorio normal sin service role (D20).

## 4. Pendientes / gates antes de merge

1. **CI `db-validate`**: aplicar migración 002 + seed con `ON_ERROR_STOP=1` sobre PostgreSQL 15 limpio; ejecutar `ci_verify.sql`.
2. **pgTAP**: ejecutar `supabase/tests/test_organization_structure.sql` (plan 66) — requiere entorno con pgTAP.
3. **Revisión humana** de la matriz D01-D20 y de la migración (especialmente revokes y DO block condicional).
4. Confirmar que no se introdujeron secretos ni datos personales (fixtures solo demo).

## 5. Blocker local

Docker y psql no disponibles en Windows → validación SQL solo vía CI. Documentado en
worklog y reporte.

## 6. Siguiente fase (1B.3)

Identidad, sesiones y RBAC. Docs de planificación ya creados:
`F1B3_DISCOVERY.md`, `F1B3_DATA_MODEL_PROPOSAL.md`, `F1B3_TEST_PLAN.md`.
Depende de: anclas `organization_id`/`branch_id` (ya presentes) y decisión sobre
Supabase Auth vs. tabla `session` propia.

## 7. Cambios de la sesión de retoma (31 Jul 2026, tarde)

- Añadido `src/app/admin/organization/loading.tsx` (estado loading con skeleton + `role="status"`).
- Añadido test del estado loading en `organization-page.test.tsx` (3 → 4 tests en ese archivo).
- Total suite: 79/79. Validación completa re-ejecutada: lint ✅ typecheck ✅ test ✅ build ✅.
- Sin staging; cero commits sobre `develop`.
