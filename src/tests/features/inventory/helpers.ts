import type { InventoryContext } from "@/features/inventory/application";
import {
  createInventoryActor,
  type InventoryActor,
} from "@/features/inventory/domain";
import {
  DemoInventoryReferenceCatalog,
  DemoInventoryRepository,
  NoopInventoryAuditRepository,
} from "@/features/inventory/infrastructure";
import type { InventoryContext as ContextShape } from "@/features/inventory/application";

export const ORG_A = "10000000-0000-0000-0000-000000000001";
export const ORG_B = "20000000-0000-0000-0000-000000000001";
export const USER_A = "30000000-0000-0000-0000-000000000001";
export const USER_MANAGER = "30000000-0000-0000-0000-000000000006";

export const WAREHOUSE_NOG_01 = "10000000-0000-0000-0000-000000000003";
export const VARIANT_051 = "70000000-0000-0000-0000-000000000051";
export const VARIANT_052 = "70000000-0000-0000-0000-000000000052";
export const VARIANT_053 = "70000000-0000-0000-0000-000000000053";
export const UNKNOWN_VARIANT = "70000000-0000-0000-0000-000000000999";
export const UNKNOWN_WAREHOUSE = "10000000-0000-0000-0000-000000000999";

export const READER = ["inventory.read"];
export const IMPORTER = ["inventory.read", "inventory.import"];
export const APPROVER = [
  "inventory.read",
  "inventory.import",
  "inventory.approve",
  "inventory.observe",
];
export const OBSERVER = ["inventory.read", "inventory.observe"];

export function actor(
  permissions: readonly string[] = [],
  organizationId: string = ORG_A
): InventoryActor {
  return createInventoryActor({
    userId: USER_A,
    organizationId,
    permissions,
  });
}

export function makeContext(): ContextShape & {
  auditRepository: NoopInventoryAuditRepository;
} {
  return {
    inventoryRepository: new DemoInventoryRepository(),
    auditRepository: new NoopInventoryAuditRepository(),
    referenceCatalog: new DemoInventoryReferenceCatalog(),
  };
}

/** Fresh context with no seeded snapshots (baseline flows, IA-12/13). */
export function makeEmptyContext(): InventoryContext & {
  inventoryRepository: DemoInventoryRepository;
  auditRepository: NoopInventoryAuditRepository;
} {
  return {
    inventoryRepository: new DemoInventoryRepository({ seed: false }),
    auditRepository: new NoopInventoryAuditRepository(),
    referenceCatalog: new DemoInventoryReferenceCatalog(),
  };
}

/** Fresh context whose demo repository is exposed for state assertions. */
export function makeDemoContext(): InventoryContext & {
  inventoryRepository: DemoInventoryRepository;
  auditRepository: NoopInventoryAuditRepository;
} {
  return makeContext() as InventoryContext & {
    inventoryRepository: DemoInventoryRepository;
    auditRepository: NoopInventoryAuditRepository;
  };
}
