# F1B.2 — Revisión de aislamiento de service role
## Verificación cruzada de Seguridad contra el patrón de acceso a datos

**Fecha:** 2026-07-31
**Estado:** Revisión de turno nocturno — sin commits.

---

## 1. Objetivo

Confirmar que el nuevo dominio de organización (Fase 1B.2) no debilita el aislamiento de
la `service_role` establecido al cierre de la Fase 1B.1, y que todo acceso de lectura
se hace con el cliente anónimo del servidor.

## 2. Patrón de referencia (Fase 1B.1, mergeado)

| Capa | Archivo | Rol de BD | Notas |
|------|---------|-----------|-------|
| Cliente de servidor (normal) | `src/lib/supabase/server.ts` | `anon` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `import "server-only"`; sin persistencia de sesión |
| Cliente de servidor (privilegiado) | `src/lib/supabase/admin.ts` | `service_role` + `SUPABASE_SERVICE_ROLE_KEY` | `import "server-only"`; `getServerEnv()` exige la variable |
| Cliente de navegador | `src/lib/supabase/client.ts` | `anon` | Sin acceso a secretos de servidor |
| Env | `src/lib/supabase/config.ts`, `src/schemas/env.ts` | — | `SUPABASE_SERVICE_ROLE_KEY` nunca con prefijo `NEXT_PUBLIC_` |

## 3. Hallazgos de la revisión (1B.2)

| # | Verificación | Resultado | Evidencia |
|---|--------------|-----------|-----------|
| 1 | El repositorio normal usa el cliente anónimo del servidor | ✅ | `supabase-organization-repository.ts` importa `createSupabaseServerClient` (`@/lib/supabase/server`), nunca `createSupabaseAdminClient` |
| 2 | Ningún archivo de la feature referencia la `service_role` | ✅ | `feature-security.test.ts` escanea recursivamente `src/features/organization`: 0 ocurrencias de `createSupabaseAdminClient` / `SUPABASE_SERVICE_ROLE_KEY` |
| 3 | La página admin no expone `process.env` al cliente | ✅ | `src/app/admin/organization/page.tsx` no contiene `process.env` ni `SUPABASE_SERVICE_ROLE_KEY` |
| 4 | Sin credenciales, la UI muestra un estado seguro, no un crash | ✅ | El repositorio comprueba `hasSupabaseConfig()` y lanza `RepositoryConfigurationError` tipado; la página lo captura y renderiza estado de configuración |
| 5 | Sin credenciales, no se construye ningún cliente | ✅ | `createClient` solo se invoca después del guard `hasSupabaseConfig()` |
| 6 | La DB concede privilegios mínimos | ✅ | Migración 002: revoke de tablas/sequences/routines a `public` y a `anon`/`authenticated`/`service_role` (condicional), sin `GRANT` de negocio a rol alguno; RLS se habilita en 1B.3 (decisión D13) |
| 7 | Tests de separación existentes siguen en verde | ✅ | `admin-separation.test.ts`, `client-server-separation.test.ts` intactos; suite completa 78/78 |

## 4. Riesgo residual

| Riesgo | Impacto | Mitigación propuesta |
|--------|---------|----------------------|
| Las tablas 1B.2 no tienen RLS aún | Un rol con grants (hoy solo `postgres`) podría leer todo | RLS por `organization_id` en la fase de autenticación (1B.3+); `organization_id` ya existe en todas las tablas de negocio |
| `service_role` conserva acceso administrativo global en Supabase | Necesario para migraciones futuras; no debe usarse en operación normal | Política vigente: solo `admin.ts` (server-only) y solo para tareas de sistema; la feature 1B.2 no lo usa |
| `npm audit` reporta 3 high en prod (next→postcss/sharp) | Vulnerabilidades transitivas | Sin fix sin downgrade mayor (`--force` → next@9.3.3, prohibido); se vigila con cada release |

## 5. Conclusión

**Aprobado.** El aislamiento de la `service_role` se mantiene intacto con la Fase 1B.2:
lecturas normales con anon desde servidor, ningún acceso privilegiado en la feature, y
comportamiento seguro sin credenciales locales.
