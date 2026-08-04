-- PGadm — Identity: 1:1 profile ↔ auth.user referential integrity (Phase 1B.3D-1)
-- File: 00000000000005_profile_auth_user_fk.sql
--
-- Scope: add the FK public.profiles(id) -> auth.users(id) so the 1:1 invariant
-- between Supabase Auth and the identity profile is enforced at the database
-- level. Migration 003 intentionally deferred this FK (see its note at
-- "Conditional auth.users integration", lines ~285-289); migrations 003 and 004
-- are NOT modified. seed.sql creates the matching auth.users fixtures for the
-- structural profiles in the same turn (decision D22).
--
-- CRITICAL COMPATIBILITY (CI): pr-validation.yml applies migrations + seed on
-- plain PostgreSQL 15 with NO Supabase auth schema and NO runtime roles. A hard
-- FK to auth.users would fail there, so the constraint is added under the same
-- pg_namespace/pg_class guard that migration 003 uses for the sync trigger. On
-- plain PG the block is a no-op (FK absent); on Supabase the FK is enforced.
--
-- DEFERRABLE INITIALLY DEFERRED: GoTrue inserts the auth user first and the
-- AFTER INSERT trigger _core.sync_profile() provisions the profile in the same
-- statement, so the FK is satisfiable immediately; deferred mode additionally
-- lets seed.sql load structural profiles before their matching auth users
-- inside one transaction (validated at COMMIT). All pgTAP suites run inside
-- transactions that roll back, so their self-contained fixture profiles (e.g.
-- 90000000-...-101) never trip the constraint.
--
-- ON DELETE CASCADE: deleting an auth user removes its paired profile (1:1);
-- organization_memberships.user_id already cascades from profiles (003), so the
-- whole identity row is removed together. GoTrue normally soft-deletes via
-- auth.users.deleted_at, making this a safety net rather than the common path.

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth')
     and exists (
       select 1 from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'auth' and c.relname = 'users' and c.relkind = 'r'
     )
  then
    alter table public.profiles
      add constraint profiles_auth_user_fk
      foreign key (id) references auth.users (id)
      on delete cascade
      deferrable initially deferred;
  end if;
end
$$;
