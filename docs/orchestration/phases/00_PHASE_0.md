# Trabajo local y GitHub

## Inicio

```bash
git fetch --all --prune
git status
git branch --show-current
git pull --rebase
```

## Ciclo

1. Cambiar una unidad coherente.
2. Probar.
3. Revisar `git diff`.
4. Commit.
5. Push.
6. Actualizar estado.

```bash
git add <archivos>
git commit -m "feat(inventory): add validated snapshot import"
git push -u origin HEAD
```

No subir secretos, temporales ni cambios ajenos.
