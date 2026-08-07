import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database } from "@/types/database";
import type {
  InventoryAuditAction,
  InventoryAuditEntityType,
  InventoryAuditEvent,
  InventoryAuditEventFilter,
  InventoryAuditEventInput,
  InventoryAuditRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";

const AUDIT_COLUMNS =
  "id, occurred_at, actor_user_id, organization_id, action, entity_type, entity_id, detail" as const;

type InventoryEventsInsert =
  Database["_audit"]["Tables"]["inventory_events"]["Insert"];

const MAX_HISTORY_EVENTS = 50;

/**
 * 1D.2 persistence for the audit port. Writes to `_audit.inventory_events`
 * (migration 010) through the RLS-scoped server client (the user's own
 * session, never service_role, D09/T09). The schema is exposed to PostgREST
 * (config.toml) and every access is gated by grants + RLS: select needs
 * inventory.read, insert needs any inventory.* write permission.
 */
export class SupabaseInventoryAuditRepository implements InventoryAuditRepository {
  async record(input: InventoryAuditEventInput): Promise<InventoryAuditEvent> {
    const client = await this.createClient();
    const row: InventoryEventsInsert = {
      actor_user_id: input.actorUserId,
      organization_id: input.organizationId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      detail: input.detail,
    };
    const { data, error } = await client
      .schema("_audit")
      .from("inventory_events")
      .insert(row)
      .select(AUDIT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to record inventory audit event: ${error.message}`);
    }
    return mapAuditEvent(data);
  }

  async listEvents(
    filter?: InventoryAuditEventFilter
  ): Promise<InventoryAuditEvent[]> {
    const client = await this.createClient();
    let query = client
      .schema("_audit")
      .from("inventory_events")
      .select(AUDIT_COLUMNS)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(MAX_HISTORY_EVENTS);
    if (filter?.organizationId !== undefined) {
      query = query.eq("organization_id", filter.organizationId);
    }
    if (filter?.entityType !== undefined) {
      query = query.eq("entity_type", filter.entityType);
    }
    if (filter?.entityId !== undefined) {
      query = query.eq("entity_id", filter.entityId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list inventory audit events: ${error.message}`);
    }
    return data.map(mapAuditEvent);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

function mapAuditEvent(
  row: Database["_audit"]["Tables"]["inventory_events"]["Row"]
): InventoryAuditEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    organizationId: row.organization_id,
    action: row.action as InventoryAuditAction,
    entityType: row.entity_type as InventoryAuditEntityType,
    entityId: row.entity_id,
    detail: row.detail,
  };
}
