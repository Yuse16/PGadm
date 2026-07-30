# Supabase Local — PGadm

## Prerequisites

- Docker Desktop (required for local Supabase)
- Supabase CLI (via `npx supabase`)

## Quick Start

```bash
# Start local services
npm run db:start

# Check status
npm run db:status

# Apply migrations from scratch
npm run db:reset

# Run SQL tests
npm run db:test

# Generate TypeScript types from local DB
npm run db:types

# Full verification
npm run db:verify
```

## Directory Structure

```
supabase/
  config.toml       # Local configuration (no real secrets)
  migrations/       # Versioned SQL migrations (YYYYMMDDHHMMSS_name.sql)
  seed.sql          # Initial seed data (Phase 1B.1: empty/infrastructure only)
  tests/            # pgTAP-style SQL tests
  README.md         # This file
```

## Migration Rules

1. One file per change, ordered by timestamp prefix.
2. Migrations must be idempotent where possible.
3. Include a justification comment referencing the source pack.
4. Rollback is defined conceptually in comments (not automatic).
5. Never edit a migration after it's applied to a shared branch.
6. Run `npm run db:verify` before pushing.

## Ports

| Service | Port |
|---------|------|
| API | 54321 |
| DB (direct) | 54322 |
| Studio | 54323 |

## Security Constraints

- `config.toml` never contains real secrets.
- `.env` files are git-ignored.
- `service_role` key is local-only.
- No remote Supabase projects are linked in development.
- Auth, storage, edge functions, and analytics are disabled in local config.

## Troubleshooting

- **Docker not starting**: Check Docker Desktop is running.
- **Port conflict**: Change ports in `config.toml` if 54321-54323 are in use.
- **Migration fails**: Run `npm run db:reset` to rebuild from scratch.
- **Type generation fails**: Ensure local DB is running and migrations are applied.

## Phase Status

- **Phase 1B.1**: Infrastructure only — schemas, functions, conventions. No business tables.
- **Docker**: ⚠️ NOT available on this development machine. Migrations and SQL tests are prepared but cannot be executed locally until Docker Desktop is installed.
