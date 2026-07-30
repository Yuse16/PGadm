# Task Locks

| Lock ID | File / Resource | Agent | Acquired | Released | Status |
|---------|----------------|-------|----------|----------|--------|
| LK-002 | supabase/ | Architect / DB | 2026-07-29 | — | Active |
| LK-003 | src/lib/supabase/ | Backend | 2026-07-29 | — | Active |
| LK-004 | src/schemas/env.ts | Backend / Security | 2026-07-29 | — | Active |

## Rules

- Two agents never share a worktree.
- Lock before editing; unlock on handoff.
- Critical functions pass all quality gates.
