# Security

> **Status:** Draft — being populated during Phase 1.

## Supabase Security (Phase 1B.1)

### Client/Server Separation

- Browser code uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server code uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to client).
- Environment validation throws at import time if required variables are missing.

### Database Security

- `_core` schema has default privileges restricted (no public function access).
- `_audit` schema reserved for future audit logs.
- Public schema creation privilege revoked from `public` role.
- No `SECURITY DEFINER` functions without justification.
- All functions set explicit `search_path` when handling privileges.

### Secrets Management

- `.env.example` contains only commented variable names — no real values.
- `.env`, `.env.local`, `.env.*.local` are git-ignored.
- `supabase/config.toml` contains no real secrets.
- Generated `.supabase/` directory is git-ignored.

### Dependency Vulnerabilities

Current audit status: 12 high (all dev toolchain — same as Phase 1A).
Production-only: 3 high (Next.js bundled postcss + sharp).
No new vulnerabilities introduced by Phase 1B.1 dependencies.
