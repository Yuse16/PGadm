import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database } from "@/types/database";
import type {
  CatalogAuditAction,
  CatalogAuditEntityType,
  CatalogAuditEvent,
  CatalogAuditEventFilter,
  CatalogAuditEventInput,
  CatalogAuditRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";

const AUDIT_COLUMNS =
  "id, occurred_at, actor_user_id, organization_id, action, entity_type, entity_id, detail" as const;

type CatalogEventsInsert = Database["_audit"]["Tables"]["catalog_events"]["Insert"];

const MAX_HISTORY_EVENTS = 50;

/**
 * 1C.5 persistence for the audit port (D-C10). Writes to `_audit.catalog_events`
 * through the RLS-scoped server client (anon key + the user's own session, never
 * service_role, D09/T09). The schema is exposed to PostgREST (config.toml) and
 * every access is gated by grants + RLS: select needs catalog.read, insert needs
 * any catalog.* write permission.
 */
export class SupabaseCatalogAuditRepository implements CatalogAuditRepository {
  async record(input: CatalogAuditEventInput): Promise<CatalogAuditEvent> {
    const client = await this.createClient();
    const row: CatalogEventsInsert = {
      actor_user_id: input.actorUserId,
      organization_id: input.organizationId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      detail: input.detail,
    };
    const { data, error } = await client
      .schema("_audit")
      .from("catalog_events")
      .insert(row)
      .select(AUDIT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to record audit event: ${error.message}`);
    }
    return mapCatalogAuditEvent(data);
  }

  async listEvents(
    filter: CatalogAuditEventFilter
  ): Promise<CatalogAuditEvent[]> {
    const client = await this.createClient();
    let query = client
      .schema("_audit")
      .from("catalog_events")
      .select(AUDIT_COLUMNS)
      .eq("organization_id", filter.organizationId)
      .eq("entity_type", filter.entityType)
      .eq("entity_id", filter.entityId)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(
        filter.limit === undefined
          ? MAX_HISTORY_EVENTS
          : Math.max(1, Math.min(filter.limit, MAX_HISTORY_EVENTS))
      );
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list audit events: ${error.message}`);
    }
    return data.map(mapCatalogAuditEvent);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

function mapCatalogAuditEvent(
  row: Database["_audit"]["Tables"]["catalog_events"]["Row"]
): CatalogAuditEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    organizationId: row.organization_id,
    action: row.action as CatalogAuditAction,
    entityType: row.entity_type as CatalogAuditEntityType,
    entityId: row.entity_id,
    detail: row.detail,
  };
}
