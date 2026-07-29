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
