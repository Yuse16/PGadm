# F1B.2 — Índice de uso documental (inventario automatizado)
## Turno nocturno V2 — Fase 1B.2 (organización, sucursales y almacenes)

**Fecha:** 2026-07-31
**Método:** inventario automatizado (PowerShell + CSV) sobre `**/*.md` del worktree, extracción de primer encabezado (H1), conteo de subtítulos y detección de palabras clave en las primeras 40 líneas. Sin copia de contenido completo.
**Total inventariado:** 1264 archivos `.md` (1186 en `docs/packs/`, 66 en `docs/orchestration/`, 12 raíz/core).
**Revisados por encabezado:** 1264 (100%). **Leídos profundamente (Nivel A):** 34. **Nivel B:** 46 (encabezados + secciones). **Nivel C:** resto inventariado.

---

## 1. Resumen de inventario por pack

| Pack | Archivos | Revisados | Términos relevantes | Agente | Uso en F1B.2 |
|------|---:|---:|---|---|---|
| 00-governance | 4 | 4 | changelog, decisiones, documentación, source of truth | Orquestador/Doc | Convenciones de gobernanza y changelog |
| 01-business | 6 | 4 | reglas de negocio, organización | Arquitectura | Regla "todo pertenece a una organización" |
| 02-layout | 17 | 6 | layout, sucursal, tienda, ubicación | Frontend | Dependencias futuras (fuera de alcance) |
| 03-commercialization | 24 | 8 | comercialización, tienda, permiso | Frontend | Permisos futuros (fuera de alcance) |
| 04-sales | 34 | 12 | ventas, sucursal, tienda, permiso, migración | Backend/Frontend | Dependencias futuras |
| 05-inventory | 35 | 14 | inventario, almacén, sucursal, tienda, CEDIS, selección tienda/almacén | Base de Datos | Regla "nunca mezclar existencias de otras sucursales"; tipos de almacén |
| 06-cedis | 37 | 15 | CEDIS, tienda, inventario, abastecimiento | Base de Datos | CEDIS = `branch_type distribution_center`; relación Nogalera↔Saltillo |
| 07-crm | 33 | 5 | CRM, cliente, permiso | Backend | Fuera de alcance |
| 08-meetings | 37 | 3 | reuniones | Frontend | Fuera de alcance |
| 09-ai | 55 | 3 | IA | Documentación | Fuera de alcance (1B.3+ docs) |
| 10-architecture | 58 | 18 | arquitectura, autorización RBAC, entidades núcleo, separación | Arquitectura/DB/Seguridad | Permisos RBAC, entidades, límites |
| 11-providers | 44 | 4 | proveedores | Backend | Fuera de alcance |
| 12-fulfillment | 46 | 4 | fulfillment, sucursal | Backend | Fuera de alcance |
| 13-reporting | 50 | 6 | reportes, prueba | QA/Frontend | Evidencia futura |
| 14-admin | 48 | 18 | organización, sucursal, rol, permiso, UserStoreRole, relaciones tienda/almacén, modelo de datos | Arquitectura/Backend/Frontend/Seguridad | Modelo organizacional y RBAC futuro (fuente principal) |
| 15-ux | 55 | 6 | UX, accesibilidad, móvil | Frontend | Estados y diseño responsive |
| 16-qa | 69 | 8 | prueba, QA, gates, evidencia | QA | Criterios de prueba |
| 17-roadmap | 62 | 6 | roadmap, fases | Orquestador/QA | Dependencias entre fases |
| 18-training | 64 | 4 | capacitación | Frontend/Doc | Fuera de alcance |
| 19-agents | 55 | 5 | agentes | Orquestador/Doc | Convenciones multiagente |
| 20-integrations | 64 | 8 | Intelisis, integración, tienda, almacén | Arquitectura/DB/Seguridad | `external_source`/`external_id` reservados |
| 21-migration | 61 | 10 | migración, códigos externos, prueba | Base de Datos/QA | Convenciones de migración y códigos externos |
| 22-security | 66 | 10 | seguridad, permiso, RLS, privilegios, prueba | Base de Datos/Seguridad | Privilegios mínimos, RLS diferida |
| 23-contracts | 66 | 12 | contrato, migración, permisos, seguridad, prueba, esquema auth | Todos | Contrato de tablas y esquema auth futuro |
| 24-master-index | 53 | 12 | índice maestro, sucursal, tienda, CEDIS, almacén, intelisis | Orquestador/Arquitectura/DB | Códigos piloto `116NOG-PGM`, `106SAL-PGM` |
| 25-audit | 43 | 6 | auditoría, permiso, prueba, seguridad | QA/Seguridad/Doc | Trazabilidad y auditoría |

## 2. Distribución de revisión por agente

| Agente | Packs asignados | Archivos Nivel A | Hallazgos clave |
|--------|-----------------|---:|---|
| Orquestador | 00, 17, 19, 24, orchestration | 9 | Locks, alcance, gates, códigos piloto |
| Arquitectura | 01, 10, 14, 20, 23, 24 | 12 | Jerarquía organizations→branches; RBAC futuro |
| Base de Datos | 05, 06, 10, 20, 21, 22, 23, 24 | 14 | CEDIS como branch; FK compuestas; PG15 |
| Backend | 01, 04, 05, 07, 10, 11, 12, 14, 20, 23 | 10 | Contratos TS, repositorios, errores |
| Frontend/UX | 03, 04, 08, 13, 14, 15, 18, 24 | 8 | Pantalla admin, estados, responsive |
| QA | 13, 16, 17, 21, 23, 24, 25 | 8 | Pruebas SQL y TS, gates, evidencia |
| Seguridad | 10, 14, 20, 22, 23, 25 | 8 | Service role, privilegios, preparación RLS |
| Documentación | 00, 09, 17, 18, 19, 24, 25 | 6 | Índice, matriz, handoff, 1B.3 |

## 3. Archivos leídos profundamente (Nivel A) — evidencia

- `docs/packs/14-admin/02_ORGANIZATION_MODEL.md`
- `docs/packs/14-admin/05_STORE_WAREHOUSE_RELATIONS.md`
- `docs/packs/14-admin/08_ROLE_MODEL.md`
- `docs/packs/14-admin/12_USER_STORE_ROLES.md`
- `docs/packs/14-admin/44_DATA_MODEL.md`
- `docs/packs/06-cedis/00_OVERVIEW.md`
- `docs/packs/05-inventory/06_STORE_WAREHOUSE_SELECTION.md`
- `docs/packs/24-master-index/08_INITIAL_BRANCH_CONTEXT.md`
- `docs/packs/23-contracts/27_AUTH_SCHEMA.md`
- `docs/packs/10-architecture/10_AUTHORIZATION.md`
- `docs/packs/10-architecture/13_CORE_ENTITIES.md`
- `docs/orchestration/workflows/*.md` (11 archivos, verificación de rotación)
- `docs/orchestration/handoffs/*` (HANDOFF_001, HANDOFF_002, REPORT_F1B1, NIGHT_WORKLOG_F1B1)
- Raíz: `DECISION_LOG.md`, `CHANGELOG.md`, `TRACEABILITY.md`, `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `AGENT_STATE.md`, `TASK_LOCKS.md`

## 4. Palabras clave con mayor cobertura (inventario)

`sucursal` (71+) · `cedis` (44+) · `prueba` (54+) · `intelisis` (40+) · `permiso` (38+) · `inventario` (30+) · `seguridad` (25+) · `almacen` (11+) · `contrato` (8+) · `migracion` (7+) · `ubicacion` (3+).

## 5. Cierre de exploración

Con este índice se cierra la exploración general. De aquí en adelante solo se consultan archivos específicos ante decisiones concretas (regla del contrato §2 y §8).
