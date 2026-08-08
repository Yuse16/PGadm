export const INVENTORY_AUDIT_ACTIONS = [
  "approve_import",
  "create_observation",
  "confirm_observation",
] as const;
export type InventoryAuditAction = (typeof INVENTORY_AUDIT_ACTIONS)[number];

export const INVENTORY_AUDIT_ENTITY_TYPES = [
  "inventory_snapshot",
  "inventory_change",
  "inventory_observation",
  "import_template",
] as const;
export type InventoryAuditEntityType = (typeof INVENTORY_AUDIT_ENTITY_TYPES)[number];

/** Append-only application audit event for inventory mutations (D-I02, pattern 1C.5). */
export interface InventoryAuditEvent {
  id: string;
  occurredAt: string;
  actorUserId: string;
  organizationId: string;
  action: InventoryAuditAction;
  entityType: InventoryAuditEntityType;
  entityId: string;
  detail: string;
}

export interface InventoryAuditEventInput {
  actorUserId: string;
  organizationId: string;
  action: InventoryAuditAction;
  entityType: InventoryAuditEntityType;
  entityId: string;
  detail: string;
}

export interface InventoryAuditEventFilter {
  organizationId?: string;
  entityType?: InventoryAuditEntityType;
  entityId?: string;
}

export interface InventoryAuditRepository {
  record(event: InventoryAuditEventInput): Promise<InventoryAuditEvent>;
  listEvents(filter?: InventoryAuditEventFilter): Promise<InventoryAuditEvent[]>;
}
