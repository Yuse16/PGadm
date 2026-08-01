# F1B.2 — Mapa de contenido de `docs/orchestration/`
## Anomalías de rotación verificadas (nombre ≠ contenido)

**Fecha:** 2026-07-31
**Regla del contrato (§7):** verificar el primer encabezado y contenido real; NO corregir ni renombrar durante esta fase; usar el contenido comprobado.

---

## 1. `docs/orchestration/workflows/` — rotación confirmada

| Archivo | Contenido real (primer encabezado) | Conclusión |
|---------|-------------------------------------|------------|
| `BRANCHING_AND_WORKTREES.md` | AGENTS.md — Constitución multiagente | ROTADO: es la constitución AGENTS |
| `COMMIT_CONVENTIONS.md` | Ramas y worktrees | ROTADO: el contenido real son ramas/worktrees |
| `DATABASE_MIGRATION_RULES.md` | CHANGELOG | ROTADO: es el template de CHANGELOG |
| `DEFINITION_OF_DONE.md` | Migraciones | ROTADO: son reglas de migraciones |
| `DEFINITION_OF_READY.md` | DECISION_LOG.md | ROTADO: es el decision log |
| `DOCUMENT_INGESTION.md` | Definition of Done | ROTADO: es el DoD |
| `LOCAL_AND_GITHUB_WORKFLOW.md` | Definition of Ready | ROTADO: es el DoR |
| `PULL_REQUEST_RULES.md` | Prompt de auditoría inicial | ROTADO: es un prompt |
| `QUALITY_GATES.md` | Prompt para continuar | ROTADO: es un prompt de continuación |
| `REPOSITORY_BOOTSTRAP.md` | Prompt para iniciar fase | ROTADO: es un prompt |
| `SECURITY_GATE.md` | Pull requests | ROTADO: son reglas de PR |

**Impacto para F1B.2:** no se citan estos archivos por su nombre. Se verifica el contenido real antes de usarlo. La migración 002 sigue las reglas reales de "Migraciones" (`DEFINITION_OF_DONE.md`) y el template real de CHANGELOG (`DATABASE_MIGRATION_RULES.md`).

## 2. `docs/orchestration/prompts/` — confirmado

| Archivo | Contenido real | Uso |
|---------|----------------|-----|
| `PGADM_NIGHT_SHIFT_F1B1_NO_COMMITS.md` | Prompt del turno nocturno F1B1 (coherente con su nombre) | Referencia del contrato previo |

## 3. `docs/orchestration/handoffs/` — coherente

Todos los handoffs, worklogs y reportes revisados tienen nombres coherentes con su contenido (HANDOFF_001, HANDOFF_002, NIGHT_WORKLOG_F1B1, REPORT_F1B1_NIGHT_SESSION).

## 4. Regla aplicada

- No se renombra, mueve ni corrige ningún archivo de `docs/orchestration/workflows/`.
- Las referencias documentales de F1B.2 usan el contenido comprobado.
- Este mapa no se volverá a rehacer (regla del contrato §7.6).
