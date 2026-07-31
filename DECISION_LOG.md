# Decision Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 001 | Clone to new `PGadm` folder | Preserve source `PG DOC` untouched | 2026-07-29 |
| 002 | Skip HANDOFF (1).md | Contains duplicate REPOSITORY_BOOTSTRAP.md content; original HANDOFF.md kept in templates | 2026-07-29 |
| 003 | Source packs 00-02 from `plomeria_garcia_pwa_docs_v0.1` | No standalone pack folders for 00-02; only subfolder exists | 2026-07-29 |
| 004 | Directory structure: `docs/packs/NN-name/` | Matches standard pack numbering with descriptive names | 2026-07-29 |
| 005 | 4 separate commits for push | Granular history for packs, agents, config, and index | 2026-07-29 |
| 006 | Next.js 16 + App Router + Tailwind v4 | create-next-app generated stack, stable with Node 24 | 2026-07-29 |
| 007 | vitest + testing-library for tests | Fast, modern test runner compatible with Next.js 16 | 2026-07-29 |
| 008 | npm as package manager | pnpm not available; npm 11 ships with Node 24 | 2026-07-29 |
| 009 | Worktree at `../PGadm-worktrees/core-app-foundation` | Isolated feature development without affecting main checkout | 2026-07-29 |
| 010 | No external services connected yet | Supabase, Vercel, Intelisis, OpenRouter deferred to later phases | 2026-07-29 |
| 011 | `_core` schema for internal functions | Keeps technical objects separate from domain schemas; prevents accidental API exposure | 2026-07-29 |
| 012 | `_audit` schema prepared early | Reserved to avoid permission reshuffling when audit tables are created in Phase 10+ | 2026-07-29 |
| 013 | pgcrypto via `create extension` for UUIDs | Architecture pack mandates UUID PKs; pgcrypto is the standard PostgreSQL extension | 2026-07-29 |
| 014 | `_core.updated_at()` trigger function | Single reusable trigger for all tables needing `updated_at`; avoids repetition | 2026-07-29 |
| 015 | `@supabase/supabase-js` only as dependency | No Supabase UI libs, auth helpers, or storage yet — only client/server boundary | 2026-07-29 |
| 016 | `zod` as devDependency only | Available for future env/schema validation; not used in runtime yet | 2026-07-29 |
| 017 | Auth disabled in local Supabase config | No auth module exists yet; enabling would create unused tables and confuse state | 2026-07-29 |
| 018 | Seed file empty for Phase 1B.1 | No business entities exist yet; seed data belongs in their respective phase branches | 2026-07-29 |
| 019 | DB CI uses direct PostgreSQL service (not Supabase) | Simpler, faster, no Docker-in-Docker overhead; Supabase-specific features not needed yet | 2026-07-29 |
| 020 | pgTAP tests deferred for CI; simple SQL used instead | pgTAP requires extension installation; standard SQL verification is sufficient for Phase 1B.1 | 2026-07-29 |
