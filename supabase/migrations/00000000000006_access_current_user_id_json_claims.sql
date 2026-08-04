-- PGadm — Identity RLS: _access.current_user_id() reads request.jwt.claims (JSON)
-- File: 00000000000006_access_current_user_id_json_claims.sql
--
-- Scope (contract F1B3, Phase 1B.3D-1): migration 004's current_user_id() only
-- reads the legacy flat GUC `request.jwt.claim.sub`. Modern PostgREST (v10+, and
-- the Supabase local pairing postgrest:14.15) no longer sets that flat GUC; it
-- sets `request.jwt.claims` (a JSON GUC) only. Under the real API every RLS
-- policy built on current_user_id() therefore resolves NULL and yields zero
-- rows (PostgREST returned HTTP 200 `[]` for a user's own profile).
--
-- Fix (no modification of 003/004, same documented D15/extension pattern 004
-- uses): CREATE OR REPLACE current_user_id() to read the `sub` claim from
-- `request.jwt.claims` first, falling back to the legacy `request.jwt.claim.sub`
-- GUC so the pgTAP RLS suite (which forges the flat GUC via set_config) and any
-- older PostgREST keep working. SQLSTATE 22P02 handling is preserved (non-UUID
-- sub -> NULL). Safe on plain PostgreSQL 15 CI: no auth schema references.
--
-- Rollback: documented, non-destructive (F1B3_RLS_POLICY_DESIGN §7).
-- This migration is an idempotent redefinition; no rollback script required.

create or replace function _access.current_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $function$
declare
  v_sub text;
begin
  v_sub := nullif(current_setting('request.jwt.claims', true), '');
  if v_sub is not null then
    begin
      v_sub := v_sub::jsonb ->> 'sub';
    exception when others then
      v_sub := null;
    end;
  end if;
  v_sub := coalesce(v_sub, current_setting('request.jwt.claim.sub', true));
  v_sub := nullif(v_sub, '');
  if v_sub is null then
    return null;
  end if;
  begin
    return v_sub::uuid;
  exception when invalid_text_representation then
    return null;
  end;
end;
$function$;

comment on function _access.current_user_id() is
  'Current authenticated user id from the verified JWT sub claim (D13). Security invoker; GUC only. Reads request.jwt.claims (JSON GUC set by PostgREST v10+) first, falls back to the legacy request.jwt.claim.sub GUC for tests and older PostgREST.';
