import type {
  LayoutAuditEvent,
  LayoutAuditEventFilter,
  LayoutAuditEventInput,
  LayoutAuditRepository,
} from "../domain";

/**
 * In-memory audit implementation for the demo data source and tests. The
 * Supabase source uses `SupabaseLayoutAuditRepository` (3.4), which persists to
 * `_audit.layout_events` (migration 011); the use cases are never touched by
 * the swap.
 */
export class NoopLayoutAuditRepository implements LayoutAuditRepository {
  readonly events: LayoutAuditEvent[] = [];

  async record(input: LayoutAuditEventInput): Promise<LayoutAuditEvent> {
    const event: LayoutAuditEvent = {
      ...input,
      id: `audit-${this.events.length + 1}`,
      occurredAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async listEvents(
    filter?: LayoutAuditEventFilter
  ): Promise<LayoutAuditEvent[]> {
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
