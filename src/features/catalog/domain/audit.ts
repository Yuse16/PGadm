/**
 * Application-level audit port (1C.3, persistence wired in 1C.5). Records
 * create/update/archive/restore events with the acting user and supports the
 * per-entity history timeline shown on the product detail page. The 1C.5
 * implementation persists to `_audit.catalog_events` without touching the use
 * cases.
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

export interface CatalogAuditEventFilter {
  organizationId: string;
  entityType: CatalogAuditEntityType;
  entityId: string;
  limit?: number;
}

export interface CatalogAuditRepository {
  record(event: CatalogAuditEventInput): Promise<CatalogAuditEvent>;
  listEvents(filter: CatalogAuditEventFilter): Promise<CatalogAuditEvent[]>;
}
