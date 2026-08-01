# F1B.3 — Threat Model
## Autenticación, RBAC y RLS

**Fecha:** 2026-08-01 (turno de tarde 1B.3)
**Estado:** Modelo de amenazas de la fase; cada amenaza referencia una decisión (`F1B3_DECISION_MATRIX.md` D#) y un caso de la matriz de pruebas de acceso.

## Activos protegidos

1. Datos organizacionales de negocio (organizations, branches, warehouses, relations) — 1B.2.
2. Identidades y perfiles (`profiles`, membresías, asignaciones).
3. Catálogos RBAC (`roles`, `permissions`, `role_permissions`).
4. Sesiones y claims de Supabase Auth.
5. Integridad de la configuración (grants, políticas RLS).

## Supuestos

- Supabase Auth gestiona contraseñas y sesiones (JWT firmado por Supabase).
- `anon` y `authenticated` se autentican vía API con su rol de Postgres respectivo.
- `service_role` solo vive en el servidor (`src/lib/supabase/admin.ts`, `server-only`).
- El cliente nunca es de confianza para `organization_id` (D12).

---

## Amenazas

### T01 — Acceso cruzado entre organizaciones
- **Descripción:** Usuario A de organización A lee/escribe filas de organización B.
- **Vector:** `organization_id` del cliente manipulado; política RLS ausente o mal escrita.
- **Probabilidad:** alta · **Impacto:** alto.
- **Mitigación:** RLS por `organization_id` derivado de `auth.uid()` (D12, D18); membresías como única fuente de pertenencia (D4); sin confiar del cliente.
- **Prueba:** ACC-01, ACC-02, ACC-03.

### T02 — Acceso cruzado entre sucursales
- **Descripción:** Usuario de sucursal NOG accede a datos/asignaciones de SAL.
- **Vector:** `branch_id` ajeno; asignación válida fuera del scope.
- **Probabilidad:** alta · **Impacto:** alto.
- **Mitigación:** `user_role_assignments.branch_id` con FK compuesta `(organization_id, branch_id)` (D5, D7); resolución de sucursal en servidor.
- **Prueba:** ACC-04.

### T03 — Escalación de privilegios (rol propio)
- **Descripción:** Usuario se asigna/activa roles de mayor privilegio o se modifica a sí mismo.
- **Vector:** escritura directa sobre `user_role_assignments`; falta de autorización para administración.
- **Probabilidad:** media · **Impacto:** alto.
- **Mitigación:** RLS/grants restringen escritura de catálogos y asignaciones a `administrator` (D8, D11, D18); el usuario no puede modificar `role_permissions` (D8).
- **Prueba:** ACC-11, ACC-12.

### T04 — Forja de claims JWT
- **Descripción:** Token con claims falsos de rol/organización.
- **Vector:** usar claims JWT como fuente de autorización.
- **Probabilidad:** media · **Impacto:** alto.
- **Mitigación:** JWT solo identidad (`sub`) (D13); autorización resuelta en BD vía `auth.uid()`.
- **Prueba:** ACC-09 (authenticated sin membresía → 0 filas).

### T05 — Usuario/membresía/rol inactivo conserva acceso
- **Descripción:** Usuario desactivado, membresía inactiva o rol inactivo sigue leyendo.
- **Vector:** omitir estado en políticas/helpers.
- **Probabilidad:** media · **Impacto:** alto.
- **Mitigación:** helpers de acceso verifican `profiles.status`, `organization_memberships.status`, `roles.status` y `user_role_assignments.status` = active (D3, D19).
- **Prueba:** ACC-05, ACC-06, ACC-07.

### T06 — `anon` obtiene datos organizacionales
- **Descripción:** El endpoint/API expone datos de negocio sin autenticación.
- **Vector:** grants o políticas para `anon`; tabla con RLS off.
- **Probabilidad:** alta · **Impacto:** crítico.
- **Mitigación:** cero grants/políticas para `anon` sobre negocio (D17); `supabase-organization-repository` sigue anon hasta 1B.3D.
- **Prueba:** ACC-08.

### T07 — `authenticated` sin membresía obtiene datos
- **Descripción:** Usuario autenticado pero sin membresía/rol lee datos de cualquier org.
- **Vector:** política RLS con fallback permisivo; grant select sin RLS.
- **Probabilidad:** alta · **Impacto:** alto.
- **Mitigación:** allowlist (D11); helpers devuelven NULL/0 sin membresía (D18).
- **Prueba:** ACC-09.

### T08 — RLS permisiva / bypass
- **Descripción:** Políticas `USING (true)`/`WITH CHECK (true)` o sin `FORCE ROW LEVEL SECURITY`; owner/bypass.
- **Vector:** RLS incompleta o desactivada en tablas; owner con `BYPASSRLS`.
- **Probabilidad:** media · **Impacto:** crítico.
- **Mitigación:** prohibición de políticas permisivas (D11, contrato §3); activar RLS y `FORCE ROW LEVEL SECURITY` en las tablas de negocio; verificación en ci_verify.
- **Prueba:** ACC-01..12 (ninguna fila fuera de scope).

### T09 — Uso de `service_role` en flujos normales
- **Descripción:** Repositorio normal usa cliente admin (service role) y omite RLS.
- **Vector:** `createSupabaseAdminClient` importado en feature.
- **Probabilidad:** media · **Impacto:** alto.
- **Mitigación:** `service_role` aislada en `src/lib/supabase/admin.ts` (1B.1); repositorios usan anon server client; `feature-security.test.ts` extiende cobertura.
- **Prueba:** ACC-13, ACC-14.

### T10 — Manipulación de `organization_id`/`branch_id` en payload
- **Descripción:** Cliente envía org/sucursal ajenas en body/query.
- **Vector:** aceptar ids de cliente como fuente de verdad.
- **Probabilidad:** alta · **Impacto:** alto.
- **Mitigación:** D12: ids derivados en servidor; RLS como red de seguridad final.
- **Prueba:** ACC-15.

### T11 — Inyección SQL vía helpers/función mal parametrizada
- **Descripción:** Funciones auxiliares con concatenación o search_path default.
- **Vector:** search_path sin fijar; funciones que aceptan código SQL.
- **Probabilidad:** baja · **Impacto:** alto.
- **Mitigación:** D16: `SET search_path` explícito en helpers; sin `SECURITY DEFINER` (D15); solo funciones de validación.
- **Prueba:** ci_verify (search_path).

### T12 — Contraseñas/credenciales en código o repo
- **Descripción:** Secrets en migraciones, seeds, tests o `.env`.
- **Vector:** copy-paste de claves reales.
- **Probabilidad:** baja · **Impacto:** crítico.
- **Mitigación:** revisión de secretos al cierre (gate 19:40); seeds usan fixtures locales, nunca credenciales reales.
- **Prueba:** escaneo de secretos en handoff/reporte.

### T13 — Catálogo RBAC manipulable por el propio usuario
- **Descripción:** Usuario modifica `roles`, `permissions` o `role_permissions`.
- **Vector:** grants de escritura amplios.
- **Probabilidad:** media · **Impacto:** alto.
- **Mitigación:** escritura restringida a `administrator` vía RLS/grants (D8, D11); catálogo seed `ON CONFLICT` sin sobrescritura de mapeos.
- **Prueba:** ACC-12.

### T14 — Perfil duplicado o desincronizado con `auth.users`
- **Descripción:** Usuario sin perfil, o dos perfiles para el mismo auth user.
- **Vector:** flujo de creación manual.
- **Probabilidad:** baja · **Impacto:** medio.
- **Mitigación:** D2 1:1 (PK=FK); trigger en `auth.users` para crear perfil; FK `ON DELETE CASCADE`.
- **Prueba:** estructura (PK única) en pruebas SQL.

### T15 — Sesiones abandonadas / reutilización de tokens
- **Descripción:** Tokens válidos tras logout o para usuario inactivo.
- **Vector:** estado evaluado solo en login.
- **Probabilidad:** media · **Impacto:** medio.
- **Mitigación:** helpers RLS evalúan `status` en cada acceso (D19); Supabase gestiona revocación de sesiones.
- **Prueba:** ACC-05 (usuario inactive pierde acceso).

---

## Priorización

| Severidad | Amenazas |
|-----------|----------|
| Crítico | T06, T08 |
| Alto | T01, T02, T03, T04, T05, T07, T09, T10, T11, T13 |
| Medio | T14, T15 |
| Bajo | — |

## Controles que NO se implementan esta tarde
- Políticas RLS funcionales (1B.3C) — la migración 003 inicial es estructural.
- Validación de que las 7 pruebas críticas pasen (1B.3D).
- Auditoría (D21).
