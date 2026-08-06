import type {
  CatalogAuditEvent,
  CatalogAuditEventFilter,
  CatalogAuditEventInput,
  CatalogAuditRepository,
} from "../domain";

/**
 * Phase 1C.3 in-memory audit implementation, kept for the demo data source and
 * tests. The Supabase source uses `SupabaseCatalogAuditRepository`, which
 * persists to `_audit.catalog_events` (1C.5, D-C10); the use cases are never
 * touched by the swap.
 */
export class NoopCatalogAuditRepository implements CatalogAuditRepository {
  readonly events: CatalogAuditEvent[] = [];

  async record(input: CatalogAuditEventInput): Promise<CatalogAuditEvent> {
    const event: CatalogAuditEvent = {
      ...input,
      id: `audit-${this.events.length + 1}`,
      occurredAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async listEvents(
    filter: CatalogAuditEventFilter
  ): Promise<CatalogAuditEvent[]> {
    const matches = this.events
      .filter(
        (event) =>
          event.organizationId === filter.organizationId &&
          event.entityType === filter.entityType &&
          event.entityId === filter.entityId
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return filter.limit === undefined
      ? matches
      : matches.slice(0, filter.limit);
  }

  clear(): void {
    this.events.length = 0;
  }
}
