/**
 * Application-level audit port (1C.3). The database persistence
 * (`_audit.catalog_events`, D-C10) is deferred to 1C.5; this phase wires the
 * contract and an in-memory implementation that records create/update/archive/
 * restore events with the acting user. 1C.5 swaps the implementation without
 * touching the use cases.
 */
export type CatalogAuditAction = "create" | "update" | "archive" | "restore";
export type CatalogAuditEntityType =
  | "product"
  | "variant"
  | "barcode"
  | "category"
  | "brand"
  | "line"
  | "unit";

export interface CatalogAuditEvent {
  id: string;
  occurredAt: string;
  actorUserId: string;
  organizationId: string;
  action: CatalogAuditAction;
  entityType: CatalogAuditEntityType;
  entityId: string;
  detail: string;
}

export type CatalogAuditEventInput = Omit<CatalogAuditEvent, "id" | "occurredAt">;

export interface CatalogAuditRepository {
  record(event: CatalogAuditEventInput): Promise<CatalogAuditEvent>;
}
