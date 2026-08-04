# F1C — Slices de Implementación (Catálogo Maestro de Productos)
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Propuesta de división de 1C en subfases entregables e incrementales.
Esta fase (discovery) NO ejecuta ninguna de ellas; define el camino para que la
revisión humana la apruebe.

---

## Visión general

```
1C.1  Diseño final (contrato humano)
  ↓
1C.2  Migración SQL + seed + verificación DB   ← modelos de datos y RLS del discovery
  ↓
1C.3  Dominio y casos de uso (sin UI)
  ↓
1C.4  Permisos, repositorios supabase y tests de seguridad
  ↓
1C.5  Auditoría `_audit.catalog_events` + cierre
```

Cada slice: definición de terminado clara, sin UI hasta 1C.6 (diferido, si aplica),
repositorios demo + supabase **sin fallback silencioso** (D031).

## 1C.1 — Diseño final del contrato (revisión humana)

- Revisar y aprobar los 8 documentos F1C (este paquete).
- Cerrar las 5 preguntas abiertas de `F1C_TEST_PLAN.md` sección 7.
- Congelar nombres de tablas/columnas y permisos `catalog.*`.
- **Definición de terminado:** decisión humana registrada en `DECISION_LOG.md`.

## 1C.2 — Migración `00000000000008_product_master.sql` + seed

- Crear las 7 tablas con RLS deny-by-default y políticas (sección 3 de
  `F1C_RLS_PERMISSION_MATRIX.md`).
- Índices únicos funcionales (`upper(sku)`, `upper(barcode)`, `lower(external_id)`),
  FK compuestas org-scoped, triggers `_core.updated_at()`.
- Cargar permisos `catalog.*` y `role_permissions` en `seed.sql`.
- Insertar datos de prueba (sección 6 de `F1C_TEST_PLAN.md`).
- **Definición de terminado:** `npm run db:lint`, `npm run db:test`, `npm run db:verify`
  en verde; `npm run db:types` regenera `src/types/database.ts`.

## 1C.3 — Dominio y casos de uso (sin UI)

- `src/features/catalog/domain/**`: entidades (Product, Variant, Category, Brand,
  Unit, Line), reglas (≥1 variante activa, profundidad ≤3, baja lógica).
- `src/features/catalog/application/**`: use cases (create/update/archive/query).
- Repositorios demo (`in-memory`) + contrato de interfaz.
- **Definición de terminado:** tests unit de dominio/use cases (patrón
  `src/tests/features/catalog/**`); `npm run test` en verde.

## 1C.4 — Repositorios Supabase, permisos y seguridad

- Repositorio `supabase` (RLS vía `authenticated`), selección por variable de
  entorno `CATALOG_DATA_SOURCE` con default `"demo"` y **error explícito** si la
  fuente falla (sin fallback silencioso; patrón `organization/repository-selection`).
- Registro de permisos `catalog.*` con `current_user_permissions()`.
- Tests: CA-15…CA-21 (aislamiento por org, deny-by-default), `admin-separation` y
  `feature-security` de catálogo.
- **Definición de terminado:** suite de seguridad 1C en verde + `npm run lint`/`typecheck`.

## 1C.5 — Auditoría y cierre

- Migración `_audit.catalog_events` (append-only, actor `_access.current_user_id()`).
- Poblado en create/update/archive de catálogo (patrón `_audit` de 1B).
- Verificación final: `npm run validate`, `npm run db:verify`, no-regresión E2E.
- **Definición de terminado:** cierre de 1C; commit de integración y handoff de 1D.

## Notas de secuenciación

- **1C.6 UI** (páginas de catálogo) no está en 1C; se propone como fase posterior
  a ventas/inventario si la UI de navegación global lo requiere.
- Los `documentos → Storage` (D-C17) y `visibilidad por sucursal` (D-C15) quedan
  fuera de 1C incluso al cierre, como deciden D-C01…D-C17.
- Ninguna subfase introduce `service_role` en cliente.
