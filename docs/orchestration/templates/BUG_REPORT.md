# PGadm — Inicio de trabajo con OpenCode

## Repositorio objetivo

`https://github.com/Yuse16/PGadm.git`

La primera acción obligatoria es ejecutar `git remote -v` dentro de la carpeta local y confirmar que `origin` apunta al repositorio correcto. No se debe hacer `push` hasta verificarlo.

## Propósito

Coordinar la construcción completa de la PWA de Plomería García con OpenCode, ramas, worktrees, commits, pruebas y handoffs.

La carpeta local debe contener la documentación funcional numerada del `00` al `25`. OpenCode debe localizar todos los `.md`; no debe confiar solo en el conteo ni inventar documentos faltantes.

## Orden inicial

1. Leer `AGENTS.md`.
2. Leer `DOCUMENT_INGESTION.md`.
3. Ejecutar `REPOSITORY_BOOTSTRAP.md`.
4. Actualizar `AGENT_STATE.md`.
5. Ejecutar Fase 0.
6. Trabajar por historias pequeñas.
7. Usar una rama y un worktree por agente.
8. Hacer commit y push después de cada unidad estable.
9. Integrar únicamente mediante gates.
10. No intentar terminar toda la PWA en una sola ejecución.
