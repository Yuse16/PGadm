import type {
  CatalogAuditEvent,
  CatalogAuditEventInput,
  CatalogAuditRepository,
} from "../domain";

/**
 * Phase 1C.3 in-memory audit implementation. Persistence to
 * `_audit.catalog_events` is deferred to 1C.5 (D-C10); this implementation
 * records events in memory so use cases can be exercised without a database
 * while keeping the audit contract wired. Swap this out in 1C.5 without
 * touching the use cases.
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

  clear(): void {
    this.events.length = 0;
  }
}
