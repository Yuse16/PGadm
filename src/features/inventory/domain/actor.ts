import { InventoryPermissionError } from "./inventory-errors";

/**
 * Acting user for inventory operations. Permission checks happen here, in the
 * application layer, BEFORE any repository write — the database enforces the
 * same rules again via RLS/grants (defense in depth, D-C09 "nunca confiar en
 * la interfaz"). Built from the RLS-scoped IdentitySession (never from client
 * payloads).
 */
export interface InventoryActor {
  readonly userId: string;
  readonly organizationId: string;
  readonly permissions: readonly string[];
  hasPermission(permissionCode: string): boolean;
  requirePermission(permissionCode: string): void;
}

export class InventoryActorImpl implements InventoryActor {
  readonly userId: string;
  readonly organizationId: string;
  readonly permissions: readonly string[];

  constructor(input: {
    userId: string;
    organizationId: string;
    permissions: readonly string[];
  }) {
    this.userId = input.userId;
    this.organizationId = input.organizationId;
    this.permissions = input.permissions;
  }

  hasPermission(permissionCode: string): boolean {
    return this.permissions.includes(permissionCode);
  }

  requirePermission(permissionCode: string): void {
    if (!this.hasPermission(permissionCode)) {
      throw new InventoryPermissionError(permissionCode);
    }
  }
}

export function createInventoryActor(input: {
  userId: string;
  organizationId: string;
  permissions: readonly string[];
}): InventoryActor {
  return new InventoryActorImpl(input);
}
