# Changelog

## 0.3.0 (2026-07-29)

- Supabase local infrastructure: `config.toml`, migrations, seed, tests, README
- Migration 001: `_core` and `_audit` schemas, pgcrypto, `updated_at()` trigger, UUID validation function
- TypeScript Supabase boundaries: `client.ts`, `server.ts`, `config.ts`, `types.ts`
- Environment validation: `src/schemas/env.ts` with safe missing-var handling
- Database types: `src/types/database.ts` (placeholder for auto-generation)
- 19 new TypeScript tests (env validation, client/server separation, config)
- CI workflow extended with `db-validate` job (PostgreSQL service, migration apply, SQL verification)
- Scripts: `db:start`, `db:stop`, `db:status`, `db:reset`, `db:lint`, `db:test`, `db:types`, `db:verify`
- `.env.example` reorganized with classifications (public, private, optional, obligatory)
- Security: client/server env separation, no secrets in code, public schema locked
- Docs: ARCHITECTURE.md, SECURITY.md, TESTING.md updated with Supabase content
- Blocking: Docker Desktop not installed — `npm run db:*` commands requiring Docker cannot execute locally

## 0.2.0 (2026-07-29)

- Next.js 16 application scaffolded (App Router, TypeScript, Tailwind v4, ESLint)
- Modular src/ structure: app, components/ui, components/layout, features, lib, services, schemas, permissions, events, hooks, types, tests
- Application shell: layout with header/footer, home page, health check page, 404, error boundary, loading state
- Responsive design, PWA manifest (placeholder), metadata, viewport config
- Test infrastructure: vitest + @testing-library/react + jsdom
- 10 tests across 3 files (health check, home page, utils)
- CI workflow: `.github/workflows/pr-validation.yml` (lint, typecheck, test, build)
- Scripts: dev, build, start, lint, typecheck, test, test:watch, validate

## 0.1.0 (2026-07-29)

- Repository initialized from `PGadm` GitHub remote
- 26 documentation packs (00–25) consolidated from source
- 18 agent definitions imported to `docs/orchestration/agents/`
- Phase execution plans (00–12) staged
- Workflow, prompt, and template documents staged
- Root configuration files created (gitignore, gitattributes, editorconfig, env.example)
- INDEX.md and TRACEABILITY.md written
- Stub ARCHITECTURE.md, SECURITY.md, TESTING.md created
