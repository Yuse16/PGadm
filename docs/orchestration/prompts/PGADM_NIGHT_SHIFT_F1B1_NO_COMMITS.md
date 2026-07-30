# PGadm — Turno Nocturno Autónomo
## Fase 1B.1: Fundación local de Supabase y base de datos

**Modo de ejecución:** autónomo, prolongado y sin commits  
**Repositorio principal:** `C:\Users\GVTASNOG\Documents\PGadm`  
**Worktree esperado:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\supabase-foundation`  
**Rama esperada:** `feature/f1b-PG-DATA-001-supabase-foundation`  
**Base:** `develop`

---

## 1. Orden principal

Trabaja durante esta sesión en la Fase 1B.1 hasta dejar la implementación completa, revisada y validada.

No esperes confirmación para decisiones menores que estén claramente respaldadas por la documentación.

Detente únicamente ante un bloqueo crítico real:

- Docker no está instalado, no inicia o requiere permisos administrativos.
- Se necesita reiniciar Windows.
- Se requiere una credencial real.
- Existe riesgo de sobrescribir trabajo ajeno.
- Hay una contradicción documental que cambia el modelo de seguridad o la arquitectura.
- Una acción podría borrar datos, ramas, archivos originales o historial Git.
- Una dependencia exige una actualización incompatible o insegura.

Cuando aparezca un bloqueo no crítico, documéntalo, elige la alternativa segura y continúa con las demás tareas.

---

## 2. Prohibiciones absolutas durante el turno nocturno

No ejecutes:

```bash
git commit
git push
git merge
git rebase
git reset --hard
git clean -fd
git checkout -- .
git restore .
git branch -D
git push --force
npm audit fix --force
supabase link
```

Tampoco:

- No abras Pull Requests.
- No fusiones ramas.
- No modifiques `main` ni `develop`.
- No elimines ramas o worktrees.
- No conectes Supabase Cloud, Vercel, Intelisis ni servicios externos.
- No agregues secretos, tokens, contraseñas o claves reales.
- No alteres el contenido original de `docs/packs/`.
- No ocultes errores con `|| true`, `exit 0`, mocks engañosos o pruebas vacías.
- No cambies de stack sin una justificación documental.
- No actualices dependencias ajenas al alcance solo para reducir avisos de auditoría.
- No declares una prueba como aprobada si no fue ejecutada realmente.

**Todo el trabajo debe permanecer sin commit hasta la revisión de mañana.**

---

## 3. Verificación inicial obligatoria

Antes de modificar archivos:

```bash
cd C:\Users\GVTASNOG\Documents\PGadm
git status
git remote -v
git branch -a
git log --oneline --decorate -15
git worktree list
```

Confirma:

- `develop` está limpia y actualizada.
- Fase 1A está marcada como completada.
- La rama de Fase 1B.1 existe o puede crearse desde `develop`.
- El worktree esperado no contiene trabajo de otra tarea.
- No hay cambios locales ajenos.
- `origin` apunta a `https://github.com/Yuse16/PGadm.git`.

Si la rama o el worktree todavía no existen, créalos desde la última versión de `develop`:

```bash
git checkout develop
git pull --ff-only origin develop
git worktree add C:\Users\GVTASNOG\Documents\PGadm-worktrees\supabase-foundation -b feature/f1b-PG-DATA-001-supabase-foundation develop
```

Después trabaja exclusivamente dentro del worktree.

Registra la tarea activa en `TASK_LOCKS.md`, pero no hagas commit.

---

## 4. Documentación que debe leerse

Antes de diseñar la solución, revisa:

- `AGENTS.md`
- `AGENT_STATE.md`
- `DECISION_LOG.md`
- `TASK_LOCKS.md`
- `docs/INDEX.md`
- `docs/TRACEABILITY.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `docs/packs/00-governance/`
- `docs/packs/01-business/`
- `docs/packs/10-architecture/`
- `docs/packs/14-admin/`
- `docs/packs/16-qa/`
- `docs/packs/20-integrations/`
- `docs/packs/21-migration/`
- `docs/packs/22-security/`
- `docs/packs/23-contracts/`
- `docs/packs/24-master-index/`
- `docs/orchestration/phases/`
- `docs/orchestration/workflows/`

Crea una matriz interna con:

| Decisión | Fuente documental | Implementación prevista | Riesgo |
|---|---|---|---|

Cuando algo no esté definido, registra una decisión pendiente en `DECISION_LOG.md`. No inventes reglas de negocio.

---

## 5. Agentes activos y responsabilidades

El Orquestador coordina el trabajo y evita que dos agentes modifiquen simultáneamente los mismos archivos.

### 5.1 Orquestador

- Mantener el plan y el orden de dependencias.
- Asignar archivos y locks.
- Vigilar el alcance.
- Consolidar hallazgos.
- Ejecutar los gates finales.
- Evitar commits durante toda la sesión.
- Preparar el reporte de mañana.

### 5.2 Arquitectura

- Revisar límites entre Next.js, Supabase CLI y PostgreSQL.
- Validar estructura de carpetas.
- Evitar acoplamiento prematuro.
- Revisar separación navegador/servidor.
- Confirmar que la Fase 1B.1 no implemente entidades de fases posteriores.

### 5.3 Base de datos

- Preparar `supabase/`.
- Diseñar la migración técnica inicial.
- Crear pruebas SQL reales.
- Verificar reconstrucción desde cero.
- Generar tipos desde el esquema local cuando sea posible.
- Revisar permisos, funciones, `search_path` y exposición de esquemas.

### 5.4 Backend

- Crear límites de configuración y clientes de Supabase.
- Separar cliente de navegador y cliente de servidor.
- Validar variables de entorno.
- Evitar importaciones que rompan el build sin credenciales externas.
- No implementar autenticación ni sesiones todavía.

### 5.5 QA

- Diseñar y ejecutar pruebas SQL y TypeScript.
- Mantener las 10 pruebas existentes.
- Validar scripts `db:*`.
- Ejecutar ciclos repetidos de lint, typecheck, test y build.
- Registrar comandos y resultados exactos.

### 5.6 Seguridad

- Buscar secretos.
- Revisar variables públicas y privadas.
- Auditar dependencias.
- Revisar privilegios SQL.
- Revisar seed y logs.
- Verificar que no se use `service_role` en navegador.
- Reportar vulnerabilidades nuevas sin ejecutar soluciones destructivas.

### 5.7 Documentación

- Mantener README de Supabase.
- Actualizar arquitectura, seguridad y pruebas.
- Preparar handoff.
- Actualizar `AGENT_STATE.md`, `CHANGELOG.md`, `DECISION_LOG.md` y `TASK_LOCKS.md`.
- No modificar el contenido original de los packs.

---

## 6. Estrategia de trabajo de los agentes

No actives veinte agentes a la vez. Usa únicamente los siete roles anteriores.

Secuencia recomendada:

1. Orquestador + Arquitectura: auditoría y plan.
2. Base de datos + Seguridad: Supabase local, migraciones y privilegios.
3. Backend + Seguridad: límites TypeScript y variables.
4. QA: pruebas y scripts.
5. Arquitectura + QA + Seguridad: revisiones cruzadas.
6. Documentación: consolidación y handoff.
7. Orquestador: validación completa y reporte.

Cuando dos agentes necesiten el mismo archivo:

- El Orquestador asigna un único propietario temporal.
- Los demás entregan observaciones, no escriben simultáneamente.
- El lock se registra en `TASK_LOCKS.md`.

---

## 7. Alcance técnico autorizado

### 7.1 Prerrequisitos

Registra:

```bash
node --version
npm --version
docker --version
docker compose version
docker info
npx supabase --version
```

Comprueba puertos y espacio disponible.

No instales Supabase CLI globalmente. Prefiere una versión reproducible mediante dependencia de desarrollo o `npx` con versión fijada.

Si Docker no funciona:

- Documenta el error exacto.
- No simules resultados.
- Continúa preparando configuración, SQL, TypeScript, documentación y pruebas estáticas.
- Marca las verificaciones que dependen de Docker como bloqueadas.
- No declares la fase terminada.

### 7.2 Estructura mínima

Prepara:

```text
supabase/
├── config.toml
├── migrations/
├── seed.sql
├── tests/
└── README.md
```

Puede agregarse estructura adicional solo si está justificada.

### 7.3 Migración técnica inicial

La migración puede incluir solamente fundamentos técnicos, por ejemplo:

- esquema interno necesario;
- convención de timestamps;
- función reutilizable para `updated_at`;
- comentarios de seguridad;
- privilegios mínimos;
- preparación técnica para auditoría futura.

Antes de crear cada objeto SQL, documenta:

- nombre;
- propósito;
- fuente documental;
- privilegios;
- razón para incluirlo ahora.

No crear todavía:

- `organizations`
- `branches`
- `warehouses`
- `profiles`
- `roles`
- `permissions`
- `products`
- `inventory`
- `sales`
- `customers`
- entidades de CRM, layout, CEDIS o proveedores

No usar `SECURITY DEFINER` salvo necesidad demostrada. Si se usa, fija `search_path` y documenta el riesgo.

### 7.4 Límites TypeScript

Puede prepararse:

```text
src/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       ├── config.ts
│       └── types.ts
├── schemas/
│   └── env.ts
└── types/
    └── database.ts
```

Reglas:

- No login.
- No middleware de sesión.
- No pantallas de autenticación.
- No llamadas reales a Supabase Cloud.
- Nunca exponer claves privadas con `NEXT_PUBLIC_`.
- Nunca usar `service_role` en navegador.
- El build debe funcionar sin credenciales externas reales.
- Los tipos de base deben generarse desde el esquema local cuando Docker lo permita.
- No usar `any` para esconder contratos.

### 7.5 Variables de entorno

Actualiza `.env.example` solo con nombres y comentarios seguros.

Clasifica:

- públicas de navegador;
- privadas del servidor;
- locales;
- opcionales;
- requeridas en fases futuras.

No escribir valores reales ni valores generados por el entorno local.

Confirma que estén ignorados:

```text
.env
.env.local
.env.*.local
supabase/.temp/
```

### 7.6 Scripts

Prepara scripts reproducibles:

```json
{
  "db:start": "...",
  "db:stop": "...",
  "db:status": "...",
  "db:reset": "...",
  "db:lint": "...",
  "db:test": "...",
  "db:types": "...",
  "db:verify": "..."
}
```

`db:verify` debe fallar cuando falle una verificación. No ocultar errores.

Cuando Docker esté disponible debe validar:

1. Inicio de Supabase local.
2. Aplicación de migraciones desde cero.
3. Ejecución del seed.
4. Lint SQL.
5. Pruebas SQL.
6. Generación o validación de tipos.
7. Estado final.
8. Cierre limpio cuando corresponda.

### 7.7 Seed

`seed.sql` puede estar vacío o contener solo elementos técnicos indispensables.

No agregar:

- personas reales;
- teléfonos;
- correos;
- clientes;
- empleados;
- credenciales;
- datos de producción.

### 7.8 Pruebas SQL

Valida realmente:

- existencia de los esquemas técnicos;
- comportamiento de `updated_at`, si existe;
- privilegios mínimos;
- ausencia de exposición accidental;
- reconstrucción limpia;
- ausencia de tablas funcionales fuera del alcance.

### 7.9 Pruebas TypeScript

Agrega pruebas para:

- variables públicas permitidas;
- variables privadas protegidas;
- fallo seguro ante configuración inválida;
- comportamiento sin credenciales externas;
- separación cliente/servidor;
- inexistencia de exposición de secretos;
- conservación de las 10 pruebas previas.

---

## 8. Ciclo nocturno de implementación y corrección

Repite este ciclo hasta que todo pase o exista un bloqueo crítico:

### Ciclo A — Inspección

```bash
git status --short
git diff --stat
git diff --check
```

### Ciclo B — Pruebas rápidas

Ejecuta las pruebas del área modificada.

### Ciclo C — Validación completa

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Cuando Supabase local esté disponible:

```bash
npm run db:verify
```

### Ciclo D — Revisión cruzada

- Arquitectura revisa diseño y alcance.
- Seguridad revisa exposición y privilegios.
- QA revisa pruebas, scripts y reproducibilidad.

### Ciclo E — Corrección

Corrige únicamente causas reales. No desactives reglas, tests o checks para obtener verde artificial.

### Ciclo F — Repetición

Vuelve a ejecutar todo después de cada corrección relevante.

Límite de seguridad:

- Si el mismo error persiste tras tres enfoques razonables, documenta causa, intentos y evidencia.
- No entres en un bucle destructivo.
- Continúa con otras tareas independientes.
- Marca el punto como bloqueo para revisión humana.

---

## 9. Revisión de dependencias

Ejecuta:

```bash
npm audit
npm audit --omit=dev
```

Compara con las 12 vulnerabilidades `high` ya registradas.

Reporta:

- conteo anterior;
- conteo actual;
- dependencias afectadas;
- si son `dev` o runtime;
- si la Fase 1B.1 agregó alguna;
- mitigación segura disponible;
- motivo para posponer cuando corresponda.

No ejecutes `npm audit fix --force`.

---

## 10. CI

Evalúa la validación de Supabase en GitHub Actions.

Solo modifiques CI si puede funcionar:

- sin secretos;
- con Supabase local;
- con Docker disponible en el runner;
- sin conexión externa;
- de manera reproducible.

Si todavía es frágil, documenta la propuesta y no la agregues.

No agregues en esta sesión el trigger `push` a `develop`, salvo necesidad estricta demostrada.

---

## 11. Documentación que debe quedar preparada

Crea o actualiza:

- `supabase/README.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `DECISION_LOG.md`
- `CHANGELOG.md`
- `AGENT_STATE.md`
- `TASK_LOCKS.md`
- nuevo handoff de Fase 1B.1
- bitácora nocturna

Crea una bitácora temporal:

```text
docs/orchestration/handoffs/NIGHT_WORKLOG_F1B1.md
```

Incluye:

- hora aproximada de cada bloque;
- agente responsable;
- archivos trabajados;
- comandos ejecutados;
- resultados;
- errores;
- correcciones;
- pendientes.

La bitácora también queda sin commit.

---

## 12. Estado que debe dejarse por la mañana

No hagas commit aunque todas las pruebas pasen.

Deja:

- rama correcta;
- worktree conservado;
- cambios visibles en `git status`;
- archivos nuevos sin commit;
- ningún push;
- ningún PR;
- ningún merge;
- ningún stash que oculte trabajo;
- build y pruebas ejecutados;
- bitácora completa;
- reporte final preparado.

No uses `git add` al finalizar. Los cambios deben permanecer revisables directamente.

---

## 13. Gates obligatorios para considerar el trabajo listo para revisión

### Gate 1 — Alcance

- No existen entidades de Fase 1B.2 o 1B.3.
- No hay autenticación ni permisos funcionales.
- No hay conexión externa.

### Gate 2 — Git

- Rama y worktree correctos.
- `main` y `develop` intactas.
- Cero commits nuevos.
- Cero pushes.
- Cero PRs.
- Cero merges.

### Gate 3 — Aplicación

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Todo debe pasar.

### Gate 4 — Base local

Cuando Docker funcione:

```bash
npm run db:verify
```

Debe pasar desde una reconstrucción limpia.

### Gate 5 — Seguridad

- Cero secretos detectados.
- Cero `service_role` expuesto.
- Privilegios mínimos.
- Sin `SECURITY DEFINER` injustificado.
- Variables correctamente separadas.
- Auditoría npm documentada.

### Gate 6 — Calidad

- Pruebas anteriores conservadas.
- Nuevas pruebas reales.
- No hay `any` injustificado.
- No hay `TODO` crítico sin registrar.
- No hay errores ocultos.

### Gate 7 — Documentación

- Arquitectura actualizada.
- Seguridad actualizada.
- Pruebas actualizadas.
- Handoff listo.
- Bitácora nocturna completa.

---

## 14. Reporte final que debe mostrar por la mañana

Entrega exactamente:

1. Resumen ejecutivo.
2. Tiempo aproximado trabajado.
3. Agentes que participaron.
4. Documentos consultados.
5. Ruta del worktree.
6. Rama y commit base.
7. Confirmación de cero commits nuevos.
8. Confirmación de cero pushes y PRs.
9. Estado de Git.
10. Versiones de Node, npm, Docker y Supabase CLI.
11. Estado de Docker.
12. Estructura creada.
13. Migraciones creadas.
14. Objetos SQL y justificación.
15. Scripts agregados.
16. Variables agregadas.
17. Límites TypeScript creados.
18. Pruebas SQL.
19. Pruebas TypeScript.
20. Resultado de `npm ci`.
21. Resultado de lint.
22. Resultado de typecheck.
23. Resultado de tests.
24. Resultado de build.
25. Resultado de `db:verify`.
26. Comparación de `npm audit`.
27. Revisión de Arquitectura.
28. Revisión de Seguridad.
29. Revisión de QA.
30. Lista completa de archivos modificados.
31. `git diff --stat`.
32. Errores encontrados y correcciones.
33. Riesgos y bloqueos.
34. Handoff.
35. Recomendación: aprobar, corregir o descartar.
36. Propuesta de commits para mañana, sin ejecutarlos.

Termina mostrando también:

```bash
git status
git diff --stat
git diff --check
```

---

## 15. Orden de inicio para OpenCode

Ejecuta ahora:

> Lee este archivo completo y conviértelo en el contrato operativo del turno nocturno. Trabaja de forma autónoma en la Fase 1B.1 dentro del worktree indicado. Usa los agentes Orquestador, Arquitectura, Base de datos, Backend, QA, Seguridad y Documentación. No realices commits, push, PR, merge, rebase ni acciones destructivas. Repite los ciclos de validación hasta que `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y, cuando Docker esté disponible, `npm run db:verify` pasen. Conserva todos los cambios sin commit para revisión humana mañana. Detente solo ante los bloqueos críticos definidos en este documento.
