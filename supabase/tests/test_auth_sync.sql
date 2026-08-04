-- PGadm — Auth sync + profile ↔ auth.user referential integrity (Phase 1B.3D-1)
-- pgTAP suite for migration 00000000000005 and the GoTrue sync path
-- (_core.sync_profile() on auth.users INSERT).
--
-- Requires the Supabase auth schema (auth.users). The suite uses psql \gset +
-- \if to branch at the FILE level: on plain-PG CI (pr-validation.yml
-- db-validate, no auth schema) only the \else marker branch is parsed and sent
-- to the server, so the auth-dependent assertions never get planned (guarded
-- SELECTs are NOT used: PostgreSQL plans subqueries at statement time, so a
-- never-executed guard would still raise "schema auth does not exist", and
-- \if (SELECT ...) is not a valid psql expression). plan() is fixed per branch
-- (19 with auth, 1 without) so both the apt pg_prove and supabase db test
-- accept the output.
--
-- Runs inside a transaction that is rolled back.

begin;

select to_regclass('auth.users') is not null as has_auth \gset

\if :has_auth

  select plan(19);

  select ok(
    true,
    'auth sync suite executed (full 18 assertions, auth schema present)'
  );

  -- ============================================================
  -- 1. Structural: FK profiles.id -> auth.users.id (migration 005)
  -- ============================================================
  select ok(
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and conname = 'profiles_auth_user_fk'
        and contype = 'f'
        and confrelid = 'auth.users'::regclass
    ),
    'migration 005 adds FK profiles.id -> auth.users.id (1:1)'
  );

  select is(
    (select condeferrable from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_auth_user_fk'),
    true,
    'profiles_auth_user_fk must be DEFERRABLE (seed loads profiles before auth users)'
  );

  select is(
    (select condeferred from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_auth_user_fk'),
    true,
    'profiles_auth_user_fk must be INITIALLY DEFERRED (checked at commit)'
  );

  select is(
    (select confdeltype from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_auth_user_fk'),
    'c',
    'profiles_auth_user_fk must be ON DELETE CASCADE (1:1 removal)'
  );

  select ok(
    exists (
      select 1 from pg_trigger
      where tgrelid = 'auth.users'::regclass
        and tgname = 'profiles_after_auth_insert'
        and not tgisinternal
    ),
    'sync trigger profiles_after_auth_insert must exist on auth.users'
  );

  -- ============================================================
  -- 2. Seed invariant: 6 structural profiles <-> 6 auth users (D22)
  -- ============================================================
  select is(
    (select count(*)::int from public.profiles),
    6,
    'seed loads 6 structural profiles'
  );

  select is(
    (select count(*)::int from auth.users),
    6,
    'seed creates 6 matching auth users (D22)'
  );

  select is(
    (select count(*)::int
       from public.profiles p
       left join auth.users u on u.id = p.id
      where u.id is null),
    0,
    'no orphan profiles (every profile has an auth user)'
  );

  select is(
    (select count(*)::int
       from auth.users u
       left join public.profiles p on p.id = u.id
      where p.id is null),
    0,
    'no orphan auth users (every auth user has a profile, 1:1 via sync trigger)'
  );

  -- ============================================================
  -- 3. Behavioral: sync trigger atomicity and idempotency
  -- ============================================================
  select lives_ok($sql$
    insert into auth.users (
      id, instance_id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      created_at, updated_at
    )
    values (
      '7d000000-0000-0000-0000-000000000001', null, 'authenticated', 'authenticated',
      'sync@pgm.test', now(), '{}', '{}', false, false, now(), now()
    )
  $sql$, 'auth user insert should succeed (trigger provisions profile)');

  select is(
    (select count(*)::int from public.profiles where id = '7d000000-0000-0000-0000-000000000001'),
    1,
    'sync_profile provisions exactly one profile for the auth user (1:1)'
  );

  select is(
    (select email from public.profiles where id = '7d000000-0000-0000-0000-000000000001'),
    'sync@pgm.test',
    'provisioned profile carries the auth email'
  );

  select lives_ok($sql$
    insert into public.profiles (id, full_name, email)
    values ('7d000000-0000-0000-0000-000000000002', 'Keep Me', 'keep@pgm.test')
  $sql$, 'structural pre-insert of a profile should succeed (deferred FK)');

  select lives_ok($sql$
    insert into auth.users (
      id, instance_id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      created_at, updated_at
    )
    values (
      '7d000000-0000-0000-0000-000000000002', null, 'authenticated', 'authenticated',
      'keep@pgm.test', now(), '{}', '{}', false, false, now(), now()
    )
  $sql$, 'auth user insert over an existing profile should succeed (ON CONFLICT DO NOTHING)');

  select is(
    (select full_name from public.profiles where id = '7d000000-0000-0000-0000-000000000002'),
    'Keep Me',
    'preexisting profile must be preserved (sync trigger does not overwrite)'
  );

  select throws_ok($sql$
    insert into auth.users (
      id, instance_id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      created_at, updated_at
    )
    values (
      '7d000000-0000-0000-0000-000000000003', null, 'authenticated', 'authenticated',
      '   ', now(), '{}', '{}', false, false, now(), now()
    )
  $sql$, '23514'::character(5), NULL, 'blank email must abort the auth user insert via profiles_email_not_blank');

  select is(
    (select count(*)::int from auth.users where id = '7d000000-0000-0000-0000-000000000003'),
    0,
    'failed sync must roll back the auth user insert (atomic 1:1)'
  );

  select is(
    (select count(*)::int from public.profiles where id = '7d000000-0000-0000-0000-000000000003'),
    0,
    'no orphan profile is left behind after a failed sync'
  );

\else

  select plan(1);

  select ok(
    true,
    'auth sync suite executed (no auth schema (plain-PG CI): zero auth assertions emitted)'
  );

\endif

select * from finish();
rollback;
