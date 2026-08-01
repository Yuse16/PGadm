# F1B.2 — Matriz de decisiones
## Organización, sucursales y almacenes

**Fecha:** 2026-07-31 (creada en turno nocturno; re-validada en Turno V2 con inventario automatizado — 1264 `.md` inventariados)
**Estado:** Borrador de turno nocturno — sin commits, pendiente de revisión humana.

Fuentes principales: pack `14-admin` (02_ORGANIZATION_MODEL, 05_STORE_WAREHOUSE_RELATIONS, 44_DATA_MODEL), pack `05-inventory` (06_STORE_WAREHOUSE_SELECTION), pack `06-cedis` (00_OVERVIEW), pack `24-master-index` (08_INITIAL_BRANCH_CONTEXT), convenciones de migración `00000000000001`.

| ID | Decisión | Fuente | Alternativas | Elección | Riesgo | Estado |
|----|----------|--------|--------------|----------|--------|--------|
| 01 | Organización y sucursales | 14-admin/02_ORGANIZATION_MODEL, 14-admin/44_DATA_MODEL | `organizations` y `branches` en `public` | Jerarquía `organizations` 1→N `branches`; toda sucursal pertenece a una organización y hereda su moneda/idioma/estado base | Sin RLS todavía, cualquier rol con grants podría leer todo; mitigado con privilegios mínimos | Aprobado (borrador) |
| 02 | Sucursal frente a CEDIS | 06-cedis/00_OVERVIEW, 05-inventory/06, 24-master-index/08 | CEDIS como entidad separada | CEDIS es una sucursal con `branch_type = 'distribution_center'` (CEDIS Saltillo `106SAL-PGM`); tienda piloto Nogalera `116NOG-PGM` es `store`; `office` reservado para centros operativos | Los packs a veces hablan de "CEDIS" como actor; el modelo uniforme evita duplicación y habilita la relación tienda→CEDIS | Aprobado (borrador) |
| 03 | Sucursal y almacenes | 14-admin/05, 05-inventory/06 | Almacén sin vínculo a sucursal | `warehouses` pertenece a una sucursal (`branch_id`); sucursal y almacén deben compartir organización (FK compuesta `(organization_id, branch_id)`) | FK compuesta evita inconsistencia de `organization_id`; requiere índice único `(organization_id, id)` en `branches` | Aprobado (borrador) |
| 04 | Varios almacenes por sucursal | 05-inventory/06 ("todos los almacenes detectados"), 14-admin/04 | Un único almacén por sucursal | Se permiten N almacenes por sucursal; `is_primary` marca el principal; índice único parcial por sucursal (`branch_id`) donde `is_primary = true` limita a un principal | Duplicidad de datos podría generarse en integraciones futuras; la unicidad parcial la previene a nivel DB | Aprobado (borrador) |
| 05 | Código único global o por organización | 14-admin/44, 24-master-index/08 | Código global único en todas las tablas | `organizations.code` único global; `branches.code` y `warehouses.code` únicos **por organización** `(organization_id, code)` | Códigos internos repetibles entre organizaciones; los externos (Intelisis) sí son únicos globales | Aprobado (borrador) |
| 06 | UUID | Migración 001, 10-architecture | Serial/identidad | `id uuid primary key default gen_random_uuid()` (pgcrypto, ya instalado) | Ninguno relevante; convención ya fijada | Aprobado |
| 07 | Estados | 14-admin/24_STATUS_CATALOGS, convención "constraints/catálogos" | Enum de PostgreSQL | `status text` con `CHECK` (active/inactive) en organizations y branches; warehouses igual; relación usa `active boolean` | CHECK evolutivos: ampliar valores requiere drop/recreate de constraint; preferible a enums rígidos | Aprobado (borrador) |
| 08 | Desactivación o soft delete | Migración 001 (convención `deleted_at` futura), contrato 1B.2 | Soft delete con `deleted_at` ahora | **Diferido:** ciclo de vida solo por `status`; `deleted_at` se evalúa cuando exista auditoría (_audit) y necesidad de conservar historial | Sin historial de baja en esta fase; aceptado porque no hay datos transaccionales aún | Aprobado (borrador) |
| 09 | Direcciones | Contrato 1B.2 ("ubicación mínima") | Tabla `addresses` | Dirección plana mínima en `branches`: `address_line`, `city`, `state_province`, `postal_code`, `country` (default `MX`) | Normalización futura de dirección obligaría a refactor; aceptado por alcance mínimo | Aprobado (borrador) |
| 10 | Zona horaria | 14-admin/02, 14-admin/44 | Entero offset | `timezone text` con nombre IANA (`America/Mexico_City` default) en `organizations` (obligatoria) y `branches` (opcional, hereda de la organización) | Offset fijo rompe con DST; IANA correcto; validación de nombre real se difiere a catálogo futuro | Aprobado (borrador) |
| 11 | Identificadores externos | 21-migration/10_EXTERNAL_CODES, 24-master-index/08 | Solo `external_id` sin fuente | `external_source` + `external_id` en las tres tablas; par obligado (ambos NULL o ambos presentes); índice único parcial global `(external_source, external_id)`; único valor esperado: `intelisis` | Duplicidad de external IDs entre orígenes queda controlada; integración real fuera de alcance | Aprobado (borrador) |
| 12 | Futura sincronización Intelisis | 20-integrations/29_STORE_MATCHING, 21-migration/10, 28_FUTURE_DIRECT_INTEGRATION | Columna libre | Columnas `external_source`/`external_id` reservadas y documentadas; sincronización real en fase de integraciones; los códigos piloto se conservan como fixtures de demo/prueba | Sin lógica de sync esta fase; solo se reserva el contrato de datos | Aprobado (borrador) |
| 13 | Estrategia futura de RLS | 22-security, convenciones de fase 1B.3 | Sin RLS nunca | RLS por `organization_id` en las tres tablas en la fase de autenticación (1B.3+); por eso `organization_id` es columna presente en todas las tablas de negocio ahora | Tablas sin RLS hoy: solo owner (postgres) puede operarlas por privilegios mínimos; sin grants públicos | Aprobado (borrador) |
| 14 | Relación futura con usuarios y roles | 14-admin/08_ROLE_MODEL, 14-admin/12_USER_STORE_ROLES, 1B.3 | Acoplar usuarios ahora | Usuarios/roles/permisos **fuera de alcance**; `organization_id` y `branch_id` quedan como anclas de scoping para RBAC futuro (UserStoreRole) | Sin dependencia de servicio, no hay autorización funcional; se documenta en F1B3 | Aprobado (borrador) |

## Decisiones complementarias (no críticas, registradas por transparencia)

| ID | Decisión | Fuente | Elección |
|----|----------|--------|----------|
| D15 | Relaciones tienda→almacén | 14-admin/05_STORE_WAREHOUSE_RELATIONS | Tabla `branch_warehouse_relations` mínima: `relationship_type = 'supply'`, `priority`, `active`, `valid_from`/`valid_to`, `special_rules`; FK compuestas garantizan misma organización; único `(branch_id, warehouse_id, relationship_type)` |
| D16 | `warehouse_type` | 05-inventory/06, 06-cedis/00_OVERVIEW | Catálogo inicial `store_backroom` / `distribution` vía CHECK; refleja almacén de tienda vs almacén de CEDIS; evolucionable por constraint |
| D17 | Seed con fixtures demo | Contrato 1B.2 sección 11, decisión 018 de F1B1 | `seed.sql` incluye solo demo: Plomería García, Nogalera `116NOG-PGM`, CEDIS Saltillo `106SAL-PGM` (sin datos personales); usados también por pruebas |
| D18 | Privilegios mínimos | 22-security, contrato sección 10 | `alter default privileges` en `public` revocando tables/sequences/routines a `public` + revokes explícitos por tabla; sin grants a anon/authenticated; RLS off hasta auth |
| D19 | Tipos TS de base | Migración 002 | `src/types/database.ts` se escribe manualmente (contrato tipado que refleja migración 002); será reemplazado por `npm run db:types` cuando Docker esté disponible |
| D20 | Repositorio normal sin service role | Contrato sección 10 | Repositorio Supabase usa `createSupabaseServerClient` (anon, session-ready); sin credenciales locales muestra estado seguro de configuración; pruebas usan repositorios falsos tipados |

## Reglas críticas NO inventadas (verificadas en docs)

- Toda sucursal, usuario y dato pertenece a una organización (14-admin/02).
- Nogalera es la tienda piloto; CEDIS Saltillo es su CEDIS de abastecimiento; códigos por validar `116NOG-PGM` y `106SAL-PGM` (24-master-index/08).
- La aplicación nunca debe mezclar existencias de otras sucursales con la tienda seleccionada (05-inventory/06).
