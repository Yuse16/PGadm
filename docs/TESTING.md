# Testing

> **Status:** Draft — being populated during Phase 1.

## Test Suites

### TypeScript Tests (vitest)

| Suite | Tests | Description |
|-------|-------|-------------|
| `src/tests/app/home.test.tsx` | 3 | Home page rendering |
| `src/tests/app/health.test.tsx` | 3 | Health check page |
| `src/tests/lib/utils.test.ts` | 4 | Utility functions |
| `src/tests/lib/supabase/config.test.ts` | 7 | Env var validation |
| `src/tests/lib/supabase/client-server-separation.test.ts` | 3 | Boundary enforcement |
| `src/tests/schemas/env.test.ts` | 9 | Schema validation |

**Total: 29 tests** — all passing.

### SQL / Database Tests

Database tests require Docker for local execution.

- `supabase/tests/test_base_foundation.sql`: pgTAP-style verification of schemas, functions, and extensions.
- CI runs equivalent checks using standard PostgreSQL syntax in a service container.

## Running Tests

```bash
# All TypeScript tests
npm test

# Database tests (requires Docker)
npm run db:test

# Full verification
npm run validate
npm run db:verify
```
