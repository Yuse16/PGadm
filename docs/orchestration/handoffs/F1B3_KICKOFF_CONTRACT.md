# F1B.3 — Kickoff Contract (turno de tarde)
## Identidad, sesiones, RBAC y RLS — consolidación de drafts

**Fecha:** 2026-08-01 (turno de tarde, 15:15–20:00)
**Base:** `develop` @ `3c4b258`
**Rama:** `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\identity-rbac-rls`
**Estado:** Documento de arranque — contrato de la tarde. No es implementación.

---

## 1. Objetivo de la fase

1B.3 habilita identidad (auth + perfiles), sesiones, RBAC por organización/sucursal, grants y políticas RLS sobre las tablas de negocio de 1B.2, y la transición de la fuente de datos demo a Supabase con `ORGANIZATION_DATA_SOURCE=supabase` (solo al final, tras validación).

## 2. Subfases 1B.3A–D

| Subfase | Contenido | Depende de |
|---------|-----------|------------|
| **1B.3A** | Identidad, perfiles y sesiones: `profiles` 1:1 con `auth.users`, estados active/inactive, sesión delegada a Supabase Auth | auth habilitado |
| **1B.3B** | Roles, permisos y asignación por organización/sucursal: `roles`, `permissions`, `role_permissions`, `organization_memberships`, `user_role_assignments` | 1B.3A |
| **1B.3C** | Grants, funciones auxiliares RLS y políticas por organización/sucursal; `SECURITY DEFINER` mínimo decidido | 1B.3B |
| **1B.3D** | Validación end-to-end multi-usuario/multi-organización; cambio a `ORGANIZATION_DATA_SOURCE=supabase`; retiro o no-default de `DemoOrganizationRepository` vía decisión documentada | 1B.3C |

## 3. Consolidación de drafts existentes

| Draft (1B.2 turno nocturno) | Qué aporta | Qué se decide este turno |
|-----------------------------|------------|--------------------------|
| `F1B3_DISCOVERY.md` | Alcance, fuentes (27_AUTH_SCHEMA, 08_ROLE_MODEL, 12_USER_STORE_ROLES, 44_DATA_MODEL, 10_AUTHORIZATION), dependencias 1B.2, riesgos | Vínculo `profiles`↔`auth.users`; sesión delegada; catálogo configurable; sucursal activa |
| `F1B3_DATA_MODEL_PROPOSAL.md` | Tablas candidatas `app_user`/`role`/`permission`/`role_permission`/`user_store_role`/`session` | Renombrado final (`profiles`, `organization_memberships`, `user_role_assignments`); FK compuestas con `organization_id`; descartar `session` propia |
| `F1B3_RBAC_MATRIX_DRAFT.md` | 8 roles seed configurables, 8 permisos, matriz rol→permiso borrador | Catálogo inicial (no decisión de negocio final); no codificar nombres |
| `F1B3_TEST_PLAN.md` | Cobertura SQL/TS/CI, criterios de salida | Matriz de pruebas de acceso (permitido/denegado) real |

## 4. Modelo inicial a validar (contrato de datos)

### `profiles`
| Columna | Tipo | Regla |
|---------|------|-------|
| `id` | uuid PK → `auth.users(id)` | 1:1 |
| `display_name` | text | |
| `status` | text CHECK (`active`/`inactive`) | inactive niega acceso |
| `created_at` / `updated_at` | timestamptz | trigger `_core` |

Sin contraseñas. Sin `session` propia: sesión delegada a Supabase Auth.

### `organization_memberships`
| Columna | Tipo | Regla |
|---------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → `organizations` | |
| `user_id` | uuid FK → `profiles` | |
| `status` | text CHECK | inactive niega acceso |
| `created_at` / `updated_at` | timestamptz | |
| único | `(organization_id, user_id)` | sin membresía duplicada |

### `roles`
| Columna | Tipo | Regla |
|---------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → `organizations` NULL | NULL = global |
| `code` / `name` | text | código único por organización |
| `scope` | text | `global` \| `organization` \| `branch` |
| `status` | text CHECK | |

### `permissions`
| Columna | Tipo | Regla |
|---------|------|-------|
| `id` | uuid PK | |
| `code` | text unique | catálogo |
| `resource` / `action` | text | ej. `organization.read` |
| `description` | text | |

### `role_permissions`
- N:M `(role_id, permission_id)` único.

### `user_role_assignments`
| Columna | Tipo | Regla |
|---------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | debe coincidir con membresía |
| `user_id` | uuid FK → `profiles` | |
| `role_id` | uuid FK | rol de la misma organización |
| `branch_id` | uuid FK NULL | sucursal de la misma organización |
| `status` | text CHECK | |
| `created_at` / `updated_at` | timestamptz | |

Debe impedir vía FK compuestas/constraints:
- organización distinta a la membresía;
- sucursal de otra organización;
- rol de otra organización;
- usuario sin membresía activa.

## 5. Principios no negociables

- **Denegación por defecto**: nada se expone sin decisión explícita.
- `organization_id` nunca se confía del cliente: se deriva de la sesión/auth (`auth.uid()`) y de las membresías.
- `anon` no obtiene datos organizacionales; `authenticated` solo lo que sus membresías/roles permiten.
- Sin RLS permisiva: no `USING (true)`/`WITH CHECK (true)` sin decisión aprobada.
- `service_role` permanece aislada (solo servidor/trusted), nunca en repositorios normales.
- `DemoOrganizationRepository` se conserva como modo demo explícito hasta 1B.3D.
- No cambiar aún el default de `ORGANIZATION_DATA_SOURCE`.
- Fixtures de prueba por usuario/organización reales para demostrar aislamiento.

## 6. Restricciones operativas

- Sin PR, sin merge, sin `main`/`develop` directo.
- No borrar ramas/worktrees/contenedores/volúmenes previos.
- No inventariar de nuevo los 1264 `.md`; exploración cerrada tras `F1B3_DECISION_MATRIX.md`.
- Si algún gate falla: no commit, documentar el bloqueo.

## 7. Documentos que genera este turno

- `F1B3_KICKOFF_CONTRACT.md` (este)
- `F1B3_DECISION_MATRIX.md`
- `F1B3_THREAT_MODEL.md`
- `F1B3_MIGRATION_PLAN.md`
- `F1B3_ACCESS_TEST_MATRIX.md`
- `F1B3_AFTERNOON_HANDOFF.md`

## 8. Migración 003 (alcance de la tarde)

- Tablas base de identidad/RBAC (sección 4).
- Constraints e índices que garantizan aislamiento.
- `profiles` 1:1 con `auth.users` (insertar perfil al crear usuario vía trigger en `auth.users`, evaluar).
- Seed de catálogo de roles/permisos idempotente (no decisión de negocio final).
- Funciones auxiliares RLS **solo si están plenamente decididas** (decisiones 14–17).
- Rollback definido.

Fuera de alcance hoy: login UI, recovery, MFA, OAuth, invitaciones, administración completa de usuarios/roles, RLS incompleta, service role en flujo normal.
