# Ramas y worktrees

## Ramas

- `main`: producción.
- `develop`: integración.
- `feature/<fase>-<id>-<descripcion>`
- `fix/<id>-<descripcion>`
- `security/<id>-<descripcion>`
- `docs/<id>-<descripcion>`
- `hotfix/<id>-<descripcion>`

## Worktree por agente

```bash
git fetch origin
git checkout develop
git pull --ff-only origin develop
mkdir -p ../PGadm-worktrees
git worktree add ../PGadm-worktrees/inventory-PG-INV-001 \
  -b feature/f2-PG-INV-001-inventory-import develop
```

Antes de integrar:

```bash
git fetch origin
git rebase origin/develop
```

Dos agentes nunca comparten worktree.
