# F1B.3 — Matriz de pruebas de acceso (Access Test Matrix)
## Autenticación, RBAC y RLS

**Fecha:** 2026-08-01 (turno de tarde 1B.3)
**Uso:** cada caso ACC-xx mapea las 7 pruebas críticas del contrato del turno y las amenazas del threat model (`F1B3_THREAT_MODEL.md` T#). El estado indica en qué subfase se ejecuta.

## Fixtures (seed, ids fijos)

| Alias | Entidad | Org | Sucursal | Estado |
|-------|---------|-----|----------|--------|
| `user_A` | profile | PGM (A) | NOG | active, rol org | 
| `user_B` | profile | PGM-DEMO-B (B) | B-SAL | active, rol org |
| `user_X` | profile | PGM (A) | NOG | active, sin rol (permiso insuficiente) |
| `user_IN` | profile | PGM (A) | NOG | **inactive** |
| `user_NOM` | profile | ninguna | — | active, sin membresía |
| `admin_PGM` | profile | PGM (A) | — (global) | active, rol `administrator` |

## Casos

| ID | Caso | Cómo se prueba | Resultado esperado | Amenazas | Prueba crítica | Estado |
|----|------|----------------|--------------------|----------|----------------|--------|
| ACC-01 | A de A **no lee** Org B | RLS select con `auth.uid()=user_A` sobre tablas scoped por `organization_id` | 0 filas de B | T01, T08 | Crítica 1 | Preparada (estructural); ejecutar en 1B.3C |
| ACC-02 | A de A no escribe en Org B | RLS insert/update con org de B | permission denied / 0 filas | T01, T08 | Crítica 1 | Idem |
| ACC-03 | Membership unique impide doble membresía | insert `(org, user)` duplicado | SQLSTATE 23505 | T01, T14 | — | **Ejecutar esta tarde** (pgTAP estructural) |
| ACC-04 | NOG no accede a SAL sin asignación | `auth.uid()=user_A` (solo NOG) contra sucursales SAL | 0 filas SAL | T02 | Crítica 2 | 1B.3C |
| ACC-05 | `user_IN` inactive pierde acceso | RLS con usuario inactive | 0 filas | T05, T15 | Crítica 3 | 1B.3C |
| ACC-06 | Membership inactive pierde acceso | memb. `status='inactive'` | 0 filas | T05 | — | 1B.3C |
| ACC-07 | Rol inactive pierde acceso | `roles.status='inactive'` | 0 filas | T05 | — | 1B.3C |
| ACC-08 | `anon` obtiene 0 filas / denied | select con rol `anon` | 0 filas o permission denied | T06, T17 | Crítica 6 | 1B.3C |
| ACC-09 | `authenticated` sin membresía → 0 filas | `auth.uid()=user_NOM` | 0 filas (no error) | T04, T07 | Crítica 6 | 1B.3C |
| ACC-10 | Rol insuficiente → permission denied | `user_X` (sin permiso) intenta operación autorizada | denegado (0 filas / RLS) | T03 | Crítica 4 | 1B.3C |
| ACC-11 | Usuario no puede auto-asignarse rol | update `user_role_assignments` como `user_X` | denied | T03 | — | 1B.3C |
| ACC-12 | Catálogo RBAC no editable por usuario común | update `role_permissions`/`permissions` como `user_X` | denied | T03, T13 | — | 1B.3C |
| ACC-13 | `service_role` aislada (server-only) | `src/lib/supabase/admin.ts` solo `server-only`; feature usa anon | análisis estático + test feature | T09 | Crítica 5 | Preparada (test feature 1B.1); ampliar |
| ACC-14 | feature-security.test.ts cubre servicio | import admin desde cliente | lanza error | T09 | Crítica 5 | esta tarde (dominio mínimo) |
| ACC-15 | Payload con org ajena no cambia resultado | petición con `organization_id` de B como A | RLS retorna 0 filas | T10, T12 | Crítica 7 | 1B.3C/E2E |
| ACC-16 | Operación autorizada funciona | `admin_PGM` lee/escribe su org | operación OK | T08 | Crítica 7 | 1B.3D |
| ACC-17 | claims JWT falsos no conceden | token con claims de rol forjados | sin efecto (resolución por `auth.uid()`) | T04, T13 | — | 1B.3C |
| ACC-18 | Ninguna función `SECURITY DEFINER` | query `pg_proc` en ci_verify | 0 funciones definer en `_access`/`_core` | T11 | — | 1B.3C |
| ACC-19 | Helpers con `search_path` fijo | inspección `pg_proc.proconfig` | contiene `search_path` | T11, D16 | — | 1B.3C |
| ACC-20 | RLS activa + `FORCE ROW LEVEL SECURITY` | `pg_policy` / `pg_class.relrowsecurity` | todas las tablas de negocio | T08 | — | 1B.3C |
| ACC-21 | No policies permisivas | `pg_policy` sin `using=true`/`with check=true` | 0 políticas permisivas | T08 | — | 1B.3C |

## 7 pruebas críticas del contrato → casos

| # | Prueba crítica | Casos |
|---|----------------|-------|
| 1 | A no lee organización B | ACC-01, ACC-02, ACC-03 |
| 2 | Sucursal sin permiso no accede a otra | ACC-04 |
| 3 | Inactive pierde acceso | ACC-05, ACC-06, ACC-07 |
| 4 | Rol insuficiente → permission denied | ACC-10 |
| 5 | `service_role` aislada | ACC-13, ACC-14 |
| 6 | anon sin datos | ACC-08, ACC-09 |
| 7 | Operaciones autorizadas sí funcionan | ACC-16, ACC-15 |

## Estado por subfase

| Subfase | Casos ejecutables | Verificación |
|---------|-------------------|--------------|
| 1B.3A/B (esta tarde) | ACC-03 (unique membership), ACC-14 (test feature), estructura de ACC-18/19 (funciones no definer, search_path) en ci_verify extendido | `db:test` + gates |
| 1B.3C | ACC-01..12, ACC-15, ACC-17..21 (RLS + helpers) | `db:test` con `set role` + simulación `auth.uid()` |
| 1B.3D | ACC-16 + E2E app con `ORGANIZATION_DATA_SOURCE=supabase` | 7 críticas completas, matriz verde |
