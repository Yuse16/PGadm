# F1B.2 — Hallazgos por agente
## Resumen accionable de la fase documental (Turno V2)

**Fecha:** 2026-07-31
**Método:** los 8 agentes lógicos procesaron sus packs asignados (ver `F1B2_DOCUMENT_USAGE_INDEX.md`). Cada hallazgo cita fuentes consultadas, reglas, decisiones, riesgos, archivos a modificar y pruebas necesarias.

---

## 1. Orquestador

- **Fuentes:** `00-governance/*`, `17-roadmap/*`, `19-agents/*`, `24-master-index/*`, `docs/orchestration/*`, raíz.
- **Reglas:** fase 1B.2 sobre `develop` (PR #3 integrado); prohibido commit/push/PR/merge/staging; base `1ea1246`.
- **Decisiones:** usar el worktree `organization-foundation`; conservar todo el trabajo existente; fase documental ≤ 90 min.
- **Riesgos:** rotación de contenido en `docs/orchestration/workflows/` (confirmado, ver content map); Docker ausente.
- **Archivos a modificar:** los 4 entregables documentales + docs V2 del turno.
- **Pruebas necesarias:** gates `lint/typecheck/test/build` repetidos.

## 2. Arquitectura

- **Fuentes:** `01-business/BUSINESS_RULES.md`, `10-architecture/*`, `14-admin/*`, `20-integrations/*`, `23-contracts/*`, `24-master-index/*`.
- **Reglas:** toda sucursal/usuario/dato pertenece a una organización; RBAC con permisos específicos; la interfaz oculta acciones y **el servidor también valida**.
- **Decisiones:** jerarquía `organizations` 1→N `branches`; CEDIS es `branch_type='distribution_center'`; sin usuarios/roles/permisos/RLS en esta fase.
- **Riesgos:** modelos futuros dependen de las anclas `organization_id`/`branch_id` → deben existir desde ahora.
- **Archivos a modificar:** migración 002, dominio TS, docs F1B3.
- **Pruebas necesarias:** consistencia de jerarquía y ausencia de entidades fuera de alcance.

## 3. Base de Datos

- **Fuentes:** `05-inventory/06`, `06-cedis/00`, `10-architecture/*`, `20-integrations/*`, `21-migration/*`, `22-security/*`, `23-contracts/*`, `24-master-index/08`.
- **Reglas:** códigos piloto `116NOG-PGM` y `106SAL-PGM` (por validar); nunca mezclar existencias de otras sucursales; migraciones PG15, sin `CREATE TRIGGER IF NOT EXISTS`, `ON_ERROR_STOP=1`.
- **Decisiones:** FK compuesta `(organization_id, branch_id)` en `warehouses`; un primario por sucursal (`is_primary` + índice único parcial); códigos únicos por organización; `external_source`/`external_id` como par obligado; estados `text`+CHECK; soft delete diferido.
- **Riesgos:** validación SQL local imposible (sin Docker/psql) → solo CI.
- **Archivos a modificar:** `supabase/migrations/00000000000002_organization_structure.sql`, `seed.sql`, `test_organization_structure.sql`, `ci_verify.sql`.
- **Pruebas necesarias:** pgTAP (tablas, PK/FK, unicidad, estados, coincidencia organizacional, primario, privilegios, PG15, ausencia de tablas fuera de alcance, reconstrucción limpia).

## 4. Backend

- **Fuentes:** packs 01, 04, 05, 07, 10, 11, 12, 14, 20, 23.
- **Reglas:** sin `any`; dominio separado de React; repositorios separados de componentes; filtros por organización; sin `select("*")` sin justificación.
- **Decisiones:** contrato tipado manual en `src/types/database.ts` (D19); repositorio normal con `createSupabaseServerClient` (anon, D20); errores tipados (`OrganizationError` jerarquía); mappers con `assert*` con contexto.
- **Riesgos:** divergencia entre el contrato TS y la migración real hasta `db:types` con Docker.
- **Archivos a modificar:** `src/features/organization/{domain,application,infrastructure}`, `src/types/database.ts`.
- **Pruebas necesarias:** dominio (validadores), mappers (filas→entidad), use-cases (repositorio falso), guard de configuración.

## 5. Frontend/UX

- **Fuentes:** packs 03, 04, 08, 13, 14, 15, 18, 24.
- **Reglas:** estados loading/vacío/error; accesibilidad (`role="status"`, `aria-live`); diseño responsive; sin login.
- **Decisiones:** pantalla `/admin/organization` de solo lectura; resuelve organización demo `PGM`; estados seguros sin credenciales.
- **Riesgos:** sin sesión/usuario, la ruta admin es de libre acceso en esta fase (aceptado).
- **Archivos a modificar:** `src/app/admin/organization/page.tsx`, `loading.tsx`, `src/features/organization/components/*`.
- **Pruebas necesarias:** renderizado del overview, vacío, error, loading, accesibilidad, separación cliente/servidor.

## 6. QA

- **Fuentes:** packs 13, 16, 17, 21, 23, 24, 25.
- **Reglas:** conservar todas las pruebas existentes (34 baseline); gates repetidos hasta verde; sin aserciones que siempre pasen; `plan()` coherente en pgTAP.
- **Decisiones:** pgTAP `plan(66)` en `test_organization_structure.sql`; sección 1B.2 en `ci_verify.sql` (~68 checks + DO blocks en transacción); 45 tests TS nuevos.
- **Riesgos:** pgTAP no ejecutable localmente (verificado por conteo regex de aserciones).
- **Archivos a modificar:** `src/tests/features/organization/*`, `supabase/tests/*`.
- **Pruebas necesarias:** 79 TS + 66 pgTAP + ~68 SQL checks.

## 7. Seguridad

- **Fuentes:** packs 10, 14, 20, 22, 23, 25.
- **Reglas:** navegador usa anon key; servidor normal sin service role; `admin.ts` con `server-only`; ninguna privada con `NEXT_PUBLIC_`; privilegios mínimos; RLS diferida a 1B.3.
- **Decisiones:** revokes explícitos + `alter default privileges` en migración 002; DO block condicional para roles Supabase; guard `hasSupabaseConfig()`.
- **Riesgos:** tablas sin RLS hoy (solo owner las opera); 3 high prod en audit sin fix no rompedor.
- **Archivos a modificar:** migración 002 (seguridad), `F1B2_SERVICE_ROLE_REVIEW.md`.
- **Pruebas necesarias:** `feature-security.test.ts`, `admin-separation.test.ts`, `client-server-separation.test.ts`.

## 8. Documentación

- **Fuentes:** packs 00, 09, 17, 18, 19, 24, 25.
- **Reglas:** no marcar la fase como integrada; trazabilidad `{DOMAIN}-{NNN}`; no modificar `docs/packs/`.
- **Decisiones:** crear índice de uso, content map, hallazgos, matriz; docs V2 del turno; preparación 1B.3.
- **Riesgos:** rotación de contenido en workflows (anomalía registrada, no corregida).
- **Archivos a modificar:** los 4 entregables + `NIGHT_WORKLOG_F1B2_V2.md`, `REPORT_F1B2_NIGHT_SESSION_V2.md`, `HANDOFF_F1B2_DRAFT_V2.md` + 4 docs F1B3.
- **Pruebas necesarias:** revisión cruzada de conteos y gate final.
