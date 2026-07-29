# AGENTS.md — Constitución multiagente

## Orden de autoridad

1. Decisiones aprobadas en `DECISION_LOG.md`.
2. Reglas explícitas de los packs `00–25`.
3. Seguridad y contratos técnicos.
4. Arquitectura aprobada.
5. Historia y criterios de aceptación.
6. Código existente.
7. Supuestos provisionales marcados.

## Reglas no negociables

- Intelisis es la fuente oficial cuando exista conflicto.
- No escribir en Intelisis durante la primera etapa.
- La IA recomienda y prepara; no ejecuta acciones críticas.
- No inventar stock, precios, códigos, líneas, acuerdos, fechas ni responsables.
- Separar datos por organización y sucursal.
- Validar permisos en backend y base.
- Auditar toda acción crítica.
- Usar migraciones para cambios de base.
- No borrar historial.
- No guardar secretos en Git.
- No hacer commits directos a `main`.
- No integrar con pruebas fallidas.

## Modelo

Existen 20 agentes especializados. Todos conocen la visión, pero cada uno modifica solo su dominio. El Orquestador activa normalmente entre 4 y 8 agentes por fase.

## Entrega obligatoria

- Objetivo.
- Documentos leídos.
- Rama y worktree.
- Archivos modificados.
- Migraciones.
- Pruebas.
- Riesgos.
- Commit.
- Push.
- Handoff.
