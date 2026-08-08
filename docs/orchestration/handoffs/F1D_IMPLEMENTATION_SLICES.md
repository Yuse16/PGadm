# F1D — Slices de Implementación (Inventario — Fase 2)
## Estado: APROBADO — D-I01…D-I14 aprobados por revisión humana (2026-08-06); 1D.1 completada, 1D.2 en curso

**Fecha:** 2026-08-06
**Rama:** `feature/f1d-PG-INVENTORY-005-inventory`

División de 1D en subfases entregables e incrementales. Solo la subfase 1D.1
(kickoff + paquete documental) está **COMPLETADA**; las subfases de implementación
**no se inician** hasta aprobación humana e instrucción expresa.

---

## Visión general

```
1D.1  Kickoff + paquete documental (modelo, RLS, test plan)  ← COMPLETADA
  ↓
1D.2  Migración SQL + seed + verificación DB   ← PENDIENTE (no iniciada)
  ↓
1D.3  Dominio y casos de uso (importación, snapshot, cambios, observaciones)
  ↓
1D.4  Repositorios supabase, permisos y seguridad
  ↓
1D.5  Integración de inventario (port 1C.5) + alertas + cierre
```

Cada slice: definición de terminado clara, repositorios demo + supabase **sin
fallback silencioso** (patrón D031/D-C22/D-I12), sin `service_role` en cliente.

## 1D.1 — Kickoff y paquete documental (COMPLETADA)

- `F1D_KICKOFF_CONTRACT.md`: alcance, restricciones, D-I01…D-I14 propuestos.
- `F1D_DATA_MODEL_PROPOSAL.md`: candidato de 5 tablas + preguntas abiertas.
- `F1D_RLS_PERMISSION_MATRIX.md`: permisos `inventory.*` + políticas RLS.
- `F1D_TEST_PLAN.md`: casos IA-1…IA-37 + no-regresión + seed.
- **Definición de terminado:** solo cambios `.md`; `git diff --check` limpio;
  decisiones **PENDIENTES de revisión humana** (no aprobadas aún).

## 1D.2 — Migración SQL + seed (PENDIENTE)

- Migración con las tablas del modelo aprobado (nombres según decisión humana sobre
  la pregunta abierta 1 de `F1D_DATA_MODEL_PROPOSAL.md`).
- RLS deny-by-default + políticas allowlist (sección 4 de `F1D_RLS_PERMISSION_MATRIX.md`).
- FK compuestas org-scoped a `product_variants` (1C) y `warehouses` (1B.2);
  `UNIQUE(organization_id, id)` en tablas padre.
- `CHECK trim() <> ''`, triggers `_core.updated_at()`, sin DELETE, revokes mínimos.
- Cargar permisos `inventory.*` y `role_permissions` (matriz D-I10) + fixtures demo
  (tabla de datos de `F1D_TEST_PLAN.md` §8).
- **Definición de terminado:** `npm run db:lint`, `npm run db:test`, `npm run db:verify`
  en verde; `npm run db:types` regenera `src/types/database.ts`.

## 1D.3 — Dominio y casos de uso (sin UI)

- `src/features/inventory/domain/**`: entidades (Snapshot, SnapshotItem, Change,
  Observation, ImportTemplate), reglas (línea base antes de cambios, solo cambios,
  ausente ≠ stock cero, observaciones no mutan stock, existencia reportada).
- `src/features/inventory/application/**`: use cases (importFile, validate, mapColumns,
  preview, approveImport → snapshot + changes + audit, listChanges, listHistory,
  createObservation, confirmObservation).
- Repositorios demo (`in-memory`) + contrato de interfaz.
- **Definición de terminado:** tests unit de dominio/use cases
  (`src/tests/features/inventory/**`); `npm run test` en verde.

## 1D.4 — Repositorios Supabase, permisos y seguridad

- Repositorio `supabase` (RLS vía `authenticated`), selección por variable de entorno
  `INVENTORY_DATA_SOURCE` con default `"demo"` y **error explícito** sin fallback
  silencioso (D-I12, patrón `repository-selection`).
- Registro de permisos `inventory.*` con `current_user_permissions()`.
- Tests: IA-23…IA-30 (aislamiento por org, deny-by-default), `admin-separation` y
  `feature-security` de inventario.
- **Definición de terminado:** suite de seguridad 1D en verde + `npm run lint`/`typecheck`.

## 1D.5 — Integración y cierre

- Poblar el port de 1C.5 `CatalogIntegrationRepository.getIntegrationSummary()`
  (current/reserved/available) con stock real de inventario (reemplaza el Noop).
- Alertas iniciales si se aprueba D-I13 (tienda en cero con CEDIS con stock, stock
  bajo, exhibido sin stock, remate sin stock, nuevo con alto stock, diferencia entre
  cargas, ausente) con umbrales configurables.
- Verificación final: `npm run validate`, `npm run db:verify`, no-regresión E2E.
- **Definición de terminado:** cierre de 1D; commit de integración y handoff de la
  siguiente fase (ventas, layout, comercialización o integración Intelisis).

## Notas de secuenciación

- Layout/ventas/comercialización/CEDIS/IA quedan **fuera** de 1D (D-I14) — consumen
  inventario en sus fases.
- `product_units_conversion` se incluye **solo si se confirman factores** (D-I09);
  de lo contrario se documenta la regla de no-convertir.
- `evidence_url` se registra como texto; el Storage para subir evidencia queda diferido
  (D-C17).
- Ninguna subfase introduce `service_role` en cliente.
- No se modifica `seed.sql` hasta 1D.2 (prohibido en 1D.1).
