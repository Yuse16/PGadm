# F1C — Document Usage Index (Catálogo Maestro de Productos)
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Índice de los archivos **realmente consultados** durante el descubrimiento 1C.
No se leyeron los 1,000+ documentos del repositorio de forma indiscriminada.

---

## 1. Raíz y estado

| Archivo | Uso |
|---------|-----|
| `AGENT_STATE.md` | Estado de fases 1B.2/1B.3, gates, decisiones de datos demo, estado integrado |
| `DECISION_LOG.md` | D021–D033 (modelo org, datos demo, RLS, merge 1B.2); referencia de convención de decisiones |
| `docs/INDEX.md` | Estructura general de packs y orchestration (se detectó desfase con carpetas reales) |
| `docs/TRACEABILITY.md` | Convención de prefijos de reglas (`{DOMAIN}-{NNN}`) y mapeo de fases |

## 2. Arquitectura (`docs/packs/10-architecture/`)

| Archivo | Uso |
|---------|-----|
| `07_MULTI_BRANCH.md` | Aislamiento por sucursal; qué es org-wide vs. branch-scoped |
| `10_AUTHORIZATION.md` | Allowlist de permisos; UI oculta + servidor valida |
| `11_ROLE_MODEL.md` | Modelo de roles y asignación por sucursal |
| `13_CORE_ENTITIES.md` | Entidades núcleo: `Product`, `ProductCategory`, `ProductBrand`, `ProductLine`, `ProductTechnicalSheet` |
| `14_PRODUCT_DATA_MODEL.md` | **Fuente principal** del modelo de producto (external_code, brand, category, line, unit, format, finish, precios de referencia) |
| `30_INTELISIS_INTEGRATION_BOUNDARY.md` | Límite Intelisis: solo referencias, sin escritura en SQL |
| `34_AUDIT_LOG.md` | Patrón de auditoría de cambios |
| `40_ROW_LEVEL_SECURITY.md` | RLS como requisito además de filtros en UI |
| `12_DATABASE_STRATEGY.md` | Estrategia de base de datos (convenciones generales) |

## 3. Inventario (`docs/packs/05-inventory/`)

| Archivo | Uso |
|---------|-----|
| `08_PRODUCT_MASTER.md` | **Fuente principal**: campos mínimos del maestro de productos y reglas |
| `11_UNITS_AND_CONVERSIONS.md` | Unidades posibles (pieza/caja/bulto/juego/paquete/tarima/m²) y reglas de conversión |
| `30_PERMISSIONS.md` | Modelo de permisos de inventario (referencia de convención) |
| `31_DATA_MODEL.md` | Modelo de datos de inventario (referencia de lo que consumirá el catálogo) |

## 4. Comercialización y ventas

| Archivo | Uso |
|---------|-----|
| `03-commercialization/03_PRODUCT_LINES.md` | Líneas de producto y su rol comercial |
| `03-commercialization/20_DATA_MODEL.md` | Modelo de datos de comercialización (consumidor del catálogo) |
| `04-sales/02_PRODUCT_SEARCH.md` | Búsqueda de producto en ventas (consumidor del catálogo) |
| `04-sales/07_BOX_AND_PRICE_CALCULATION.md` | Cálculo caja/precio (m² por caja, piezas por caja) |

## 5. Integraciones (`docs/packs/20-integrations/`)

| Archivo | Uso |
|---------|-----|
| `27_EXTERNAL_IDENTIFIERS.md` | **Fuente principal**: `ExternalReference` (sistema, código externo, alcance) |
| `28_PRODUCT_MATCHING.md` | **Fuente principal**: resolución de productos (código exacto → manual) |
| `30_PRICE_INTEGRATION.md` | Precios como dato de integración (referencia) |
| `31_TECHNICAL_SHEETS.md` | Fichas técnicas (referencia futura, diferida) |

## 6. Administración, proveedores y reportes

| Archivo | Uso |
|---------|-----|
| `14-admin/10_PERMISSION_MODEL.md` | Modelo de permisos con alcances (referencia de convención) |
| `14-admin/21_CATALOG_MANAGEMENT.md` | **Fuente principal**: catálogos administrables (líneas, categorías, unidades, marcas) |
| `11-providers/02_PROVIDER_MODEL.md` | Referencia de proveedores (confirmar `supplier_id` diferido) |
| `13-reporting/46_DATA_MODEL.md` | Referencia de consumo del catálogo en reportes |

## 7. Seguridad y auditoría

| Archivo | Uso |
|---------|-----|
| `22-security/06_LEAST_PRIVILEGE.md` | Principio de mínimo privilegio |
| `22-security/13_ROW_LEVEL_SECURITY.md` | RLS como control central |
| `22-security/35_AUDIT_LOG.md` | Auditoría append-only |
| `25-audit/16_SEGURIDAD_TRAZABILIDAD.md` | Trazabilidad de cambios (referencia) |

## 8. Roadmap

| Archivo | Uso |
|---------|-----|
| `17-roadmap/02_PROJECT_PHASES.md` | Fases del proyecto (1C corresponde a catálogo) |
| `17-roadmap/05_DEPENDENCY_MAP.md` | Dependencias entre módulos (catálogo antes de inventario/ventas) |
| `17-roadmap/12_EPIC_PRODUCT_CATALOG.md` | **Fuente principal**: alcance de la épica de catálogo |

## 9. Orchestration y handoffs

| Archivo | Uso |
|---------|-----|
| `orchestration/handoffs/F1B3_DATA_MODEL_PROPOSAL.md` | Formato de referencia para propuestas de modelo de datos |
| `orchestration/handoffs/F1B3_RLS_POLICY_DESIGN.md` | Formato de referencia para diseño RLS |
| `orchestration/handoffs/F1B3_TEST_PLAN.md` | Formato de referencia para planes de prueba |

## 10. Fuente operativa externa (anexo comercial — evidencia, no regla permanente)

| Archivo | Uso |
|---------|-----|
| `C:\Users\GVTASNOG\Desktop\COMERCIALIZACION AGOSTO 2026.pdf` (30.6 MB, 24 pág.) | Evidencia de la operación comercial vigente de agosto 2026: colores de etiquetas (naranja/amarilla/roja/azul/dorada), precios por formato, paquete ahorres, 6.ª caja gratis (Perdura Stone/Stein), novedades PG, zona Outlet (remate tienda/CEDIS), descuentos por familia/marca, material de exhibición (posters/destellos) e incentivos internos de venta. Analizado en `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`. Texto extraído vía `pypdf` (el PDF es mayormente imagen; algunas listas son descargas externas vinculadas, no incrustadas). |

> Nota: el PDF es una **fuente operativa de contexto** para confirmar que las
> promociones/precios temporales no se modelan en 1C; no es documentación del
> repositorio.

## 11. Implementación actual (referencia de patrones)

| Archivo | Uso |
|---------|-----|
| `src/features/organization/**` | Patrón `domain/application/infrastructure` + `repository-selection` demo/supabase |
| `src/features/identity/**` | Guards `requirePermission`, sesión, `_access` helpers |
| `supabase/migrations/00000000000003_identity_rbac_foundation.sql` | Estructura de `permissions`/`roles`/`role_permissions` |
| `supabase/migrations/00000000000004_identity_rbac_rls.sql` | Helpers `_access.*` (current_organization_ids, has_permission) |
| `supabase/migrations/00000000000007_organization_rls_and_permissions_rpc.sql` | RLS org-scoped + `current_user_permissions()` (patrón a replicar) |
| `supabase/seed.sql` | Catálogo de permisos existente (org.read/write, branch.read, warehouse.read, role.manage, user.assign) |
