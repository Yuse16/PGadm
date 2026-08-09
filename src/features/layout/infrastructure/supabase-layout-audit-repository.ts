import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database } from "@/types/database";
import type {
  LayoutAuditAction,
  LayoutAuditEntityType,
  LayoutAuditEvent,
  LayoutAuditEventFilter,
  LayoutAuditEventInput,
  LayoutAuditRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";

const AUDIT_COLUMNS =
  "id, occurred_at, actor_user_id, organization_id, action, entity_type, entity_id, detail" as const;

type LayoutEventsInsert = Database["_audit"]["Tables"]["layout_events"]["Insert"];

const MAX_HISTORY_EVENTS = 50;

/**
 * 3.2 persistence for the layout audit port. Writes to `_audit.layout_events`
 * (migration 011) through the RLS-scoped server client (the user's own
 * session, never service_role, D09/T09). Every access is gated by grants +
 * RLS: select needs layout.read, insert needs any layout.* write permission
 * (migration 011 §8).
 */
export class SupabaseLayoutAuditRepository implements LayoutAuditRepository {
  async record(input: LayoutAuditEventInput): Promise<LayoutAuditEvent> {
    const client = await this.createClient();
    const row: LayoutEventsInsert = {
      actor_user_id: input.actorUserId,
      organization_id: input.organizationId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      detail: input.detail,
    };
    const { data, error } = await client
      .schema("_audit")
      .from("layout_events")
      .insert(row)
      .select(AUDIT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to record layout audit event: ${error.message}`);
    }
    return mapAuditEvent(data);
  }

  async listEvents(filter?: LayoutAuditEventFilter): Promise<LayoutAuditEvent[]> {
    const client = await this.createClient();
    let query = client
      .schema("_audit")
      .from("layout_events")
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
      throw new Error(`Failed to list layout audit events: ${error.message}`);
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
  row: Database["_audit"]["Tables"]["layout_events"]["Row"]
): LayoutAuditEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    organizationId: row.organization_id,
    action: row.action as LayoutAuditAction,
    entityType: row.entity_type as LayoutAuditEntityType,
    entityId: row.entity_id,
    detail: row.detail,
  };
}
