export const LAYOUT_AUDIT_ACTIONS = [
  "layout_created",
  "layout_edited",
  "layout_published",
  "layout_restored",
  "layout_archived",
  "element_edited",
  "product_assigned",
  "product_removed",
] as const;
export type LayoutAuditAction = (typeof LAYOUT_AUDIT_ACTIONS)[number];

export const LAYOUT_AUDIT_ENTITY_TYPES = [
  "layout",
  "layout_element",
  "layout_position",
  "layout_version",
] as const;
export type LayoutAuditEntityType = (typeof LAYOUT_AUDIT_ENTITY_TYPES)[number];

/** Append-only application audit event for layout mutations (D-L12, pattern 1C.5/1D). */
export interface LayoutAuditEvent {
  id: string;
  occurredAt: string;
  actorUserId: string;
  organizationId: string;
  action: LayoutAuditAction;
  entityType: LayoutAuditEntityType;
  entityId: string;
  detail: string;
}

export interface LayoutAuditEventInput {
  actorUserId: string;
  organizationId: string;
  action: LayoutAuditAction;
  entityType: LayoutAuditEntityType;
  entityId: string;
  detail: string;
}

export interface LayoutAuditEventFilter {
  organizationId?: string;
  entityType?: LayoutAuditEntityType;
  entityId?: string;
}

export interface LayoutAuditRepository {
  record(event: LayoutAuditEventInput): Promise<LayoutAuditEvent>;
  listEvents(filter?: LayoutAuditEventFilter): Promise<LayoutAuditEvent[]>;
}
