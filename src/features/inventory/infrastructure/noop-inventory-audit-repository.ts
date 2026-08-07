import type {
  InventoryAuditEvent,
  InventoryAuditEventFilter,
  InventoryAuditEventInput,
  InventoryAuditRepository,
} from "../domain";

/**
 * In-memory audit implementation for the demo data source and tests. The
 * Supabase source uses `SupabaseInventoryAuditRepository`, which persists to
 * `_audit.inventory_events` (1D.2, migration 010); the use cases are never
 * touched by the swap.
 */
export class NoopInventoryAuditRepository implements InventoryAuditRepository {
  readonly events: InventoryAuditEvent[] = [];

  async record(input: InventoryAuditEventInput): Promise<InventoryAuditEvent> {
    const event: InventoryAuditEvent = {
      ...input,
      id: `audit-${this.events.length + 1}`,
      occurredAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async listEvents(
    filter?: InventoryAuditEventFilter
  ): Promise<InventoryAuditEvent[]> {
    return this.events
      .filter((event) => {
        if (filter?.organizationId !== undefined && event.organizationId !== filter.organizationId) {
          return false;
        }
        if (filter?.entityType !== undefined && event.entityType !== filter.entityType) {
          return false;
        }
        if (filter?.entityId !== undefined && event.entityId !== filter.entityId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  clear(): void {
    this.events.length = 0;
  }
}
