# F1B.3 — Plan de pruebas propuesto (identidad y RBAC)
## Planificación — no implementado

**Fecha:** 2026-07-31
**Estado:** Propuesta para el turno 1B.3.

---

## 1. Cobertura SQL (pgTAP + ci_verify)

| Área | Verificación |
|------|--------------|
| Estructura | Tablas `app_user`, `role`, `permission`, `role_permission`, `user_store_role` (y `session` si procede) existen con sus PK/FK/unicidades |
| Exclusión | Ninguna tabla de negocio 1B.2 se altera estructuralmente |
| Catálogo | Seed de roles/permisos aplicado e idempotente (`ON CONFLICT`), consistente con 14-admin/08 |
| RLS | Políticas presentes por tabla; `app_user` autoconsultable (`auth.uid()`), negocio scoped por `organization_id` |
| Comportamiento | Inserciones/lecturas permitidas y denegadas según rol (bloqueos con `BEGIN/ROLLBACK`) |
| Privilegios | Sin grants públicos a las tablas nuevas; `service_role` aislada |

## 2. Cobertura TypeScript (Vitest)

- **Dominio**: tipos de usuario/rol/permiso, validadores de `user_store_role` (vigencia, estado), errores tipados.
- **Aplicación**: use-cases de autenticación (login/logout), resolución de permisos por sucursal activa, consulta de perfil.
- **Infraestructura**: mappers fila→entidad, repositorio con cliente `anon` de servidor, guard de configuración (mismo patrón 1B.2).
- **UI**: pantallas de login y gestión de roles; estados loading/vacío/error; separación cliente/servidor.
- **Seguridad**: sin `service_role` en rutas normales (extender `feature-security.test.ts`), sin secretos en el cliente, `server-only` en módulos de servidor.

## 3. Validación de CI

- Mantener los dos jobs actuales (`validate` + `db-validate` con PostgreSQL 15 y `ON_ERROR_STOP=1`).
- Añadir migración 003 (auth/RBAC) + sección 1B.3 en `ci_verify.sql` + suite pgTAP nueva.
- Confirmar baseline de audit sin degradación (hoy: 3 high prod, sin fix no rompedor).

## 4. Criterios de salida

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` en verde.
- Migración + seed + `ci_verify.sql` en verde en CI sobre PostgreSQL 15 limpio.
- RLS activa y verificada en las tablas de negocio 1B.2.
- Sin `git add`, sin commits, sin push, sin PR — entrega para revisión humana.
