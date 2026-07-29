# Preparación del repositorio

## Verificación

```bash
pwd
git status
git remote -v
git branch --show-current
git log --oneline -10
```

Remoto esperado: `https://github.com/Yuse16/PGadm.git`

Solo después de confirmar:

```bash
git remote set-url origin https://github.com/Yuse16/PGadm.git
git fetch --all --prune
```

## Ramas base

```bash
git checkout main
git pull --ff-only origin main
git checkout -b develop
git push -u origin develop
```

Si `develop` existe, sincronizarla sin sobrescribir trabajo local.

## Archivos mínimos

`README.md`, `AGENTS.md`, `AGENT_STATE.md`, `DECISION_LOG.md`, `CHANGELOG.md`, `.env.example`, `.gitignore`, `docs/INDEX.md`, `docs/TRACEABILITY.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/TESTING.md`.

## Prohibiciones

No usar `reset --hard`, no borrar archivos, no reemplazar un proyecto existente y no subir `.env`.
