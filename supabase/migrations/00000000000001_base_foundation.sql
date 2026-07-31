-- PGadm — Base Foundation
-- Phase 1B.1: Technical infrastructure only.
-- No functional business tables (organizations, branches, users, roles, etc.).
--
-- Justification: This migration establishes conventions and internal schemas
-- required by all subsequent migrations. Per the architecture pack (10-architecture/12)
-- and contracts pack (23-contracts/25), UUID keys, UTC timestamps, soft deletes,
-- and audit preparation must be in place before any business entity is created.

-- ============================================================
-- Schema: _core
-- Purpose: Internal technical objects (functions, helpers, types).
-- Not exposed via API. Not queryable by application code directly.
-- ============================================================
create schema if not exists _core;

-- ============================================================
-- Schema: _audit (preparation)
-- Purpose: Reserved for future audit log tables (Phase 10+).
-- Created now to avoid permission reshuffling later.
-- ============================================================
create schema if not exists _audit;

-- ============================================================
-- Extension: pgcrypto
-- Purpose: gen_random_uuid() for UUID primary keys.
-- Justification: Required by architecture pack — all PKs are UUIDs.
-- Safe to enable now; no data dependency.
-- ============================================================
create extension if not exists "pgcrypto" with schema public;

-- ============================================================
-- Function: _core.updated_at()
-- Purpose: Trigger function to auto-set updated_at on row update.
-- Justification: Standard convention per database rules (23-contracts/25).
-- Every business table will use this. Defining once avoids repetition.
-- ============================================================
create or replace function _core.updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now() at time zone 'utc';
  return new;
end;
$$;

comment on function _core.updated_at() is
  'Trigger function that sets updated_at to current UTC timestamp on row update.';

-- ============================================================
-- Function: _core.set_updated_at_column(table_name text)
-- Purpose: Conditionally add updated_at column and attach trigger.
-- Idempotent: safe to call multiple times.
-- ============================================================
create or replace function _core.set_updated_at_column(table_name text)
returns void
language plpgsql
as $$
begin
  execute format(
    'alter table %I add column if not exists updated_at timestamptz not null default now()'
  , table_name);
  execute format(
    'create trigger if not exists %I before update on %I for each row execute function _core.updated_at()'
  , table_name || '_updated_at', table_name);
end;
$$;

comment on function _core.set_updated_at_column(text) is
  'Idempotently adds updated_at column and trigger to a table.';

-- ============================================================
-- Convention: Column naming and types
--
-- Every business table MUST include:
--   id          uuid primary key default gen_random_uuid()
--   created_at  timestamptz not null default now()
--   updated_at  timestamptz not null default now()  (via trigger)
--   deleted_at  timestamptz  (soft delete, future use)
--
-- Rationale: Contracts pack (23-contracts/25) and architecture pack (10-architecture/12)
-- establish UUID PKs and UTC timestamps as non-negotiable conventions.
-- Defining them here as a documented convention; individual migrations
-- will implement them per table.
-- ============================================================

-- ============================================================
-- Function: _core.is_uuid(text)
-- Purpose: Validate UUID format. Useful for input validation.
-- ============================================================
create or replace function _core.is_uuid(value text)
returns boolean
language plpgsql
immutable
as $$
begin
  return value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
end;
$$;

comment on function _core.is_uuid(text) is
  'Validates whether a text value is a well-formed UUID.';

-- ============================================================
-- Security: Revoke public schema creation
-- Prevent application roles from creating objects in public.
-- ============================================================
revoke create on schema public from public;

-- ============================================================
-- Security: Restrict _core and _audit schemas
-- Only superuser/owner should manage internal schemas.
-- ============================================================
alter default privileges in schema _core revoke all on routines from public;

reset all;
