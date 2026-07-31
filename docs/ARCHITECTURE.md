# Architecture

> **Status:** Draft — being populated during Phase 1.

## Overview

PGadm is a multi-agent, multi-branch PWA for Plomería García. The system follows a
microfrontend PWA shell pattern with a PostgreSQL backend, JWT-based authentication,
and a modular domain-driven directory structure.

## Supabase Integration

| Component | Local | Production |
|-----------|-------|------------|
| Database | Supabase local (PostgreSQL 15) | Supabase Cloud (PostgreSQL 15) |
| Auth | Disabled locally (Phase 1B.1) | TBD |
| Storage | Disabled locally | TBD |
| Edge Functions | Disabled locally | TBD |

### Local Setup

- Supabase runs locally via Docker using `supabase start`.
- Migrations are versioned SQL files in `supabase/migrations/`.
- Types are generated with `npm run db:types` from the local schema.
- No remote Supabase project is linked during local development.

## Database Conventions

| Convention | Standard |
|------------|----------|
| Primary keys | UUID via `gen_random_uuid()` |
| Timestamps | UTC (`timestamptz`) |
| Auto-update | `_core.updated_at()` trigger |
| Soft delete | `deleted_at timestamptz` (future) |
| Schemas | `_core` (internal), `_audit` (future), `public` (domain) |

## Directory Structure

```
src/
  lib/supabase/     # Client/server boundaries
  schemas/env.ts    # Environment validation
  types/database.ts # Auto-generated DB types
supabase/
  config.toml       # Local Supabase configuration
  migrations/       # Versioned SQL migrations
  seed.sql          # Seed data
  tests/            # SQL verification tests
```
