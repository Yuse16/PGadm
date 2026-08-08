import { CatalogPermissionError } from "./catalog-errors";

/**
 * Acting user for catalog operations. Permission checks happen here, in the
 * application layer, BEFORE any repository write — the database enforces the
 * same rules again via RLS/grants and the `_catalog.enforce_status_transition`
 * trigger (defense in depth, D-C09 "nunca confiar en la interfaz").
 *
 * Built from the RLS-scoped IdentitySession (never from client payloads).
 */
export interface CatalogActor {
  readonly userId: string;
  readonly organizationId: string;
  readonly permissions: readonly string[];
  hasPermission(permissionCode: string): boolean;
  requirePermission(permissionCode: string): void;
}

export class CatalogActorImpl implements CatalogActor {
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
      throw new CatalogPermissionError(permissionCode);
    }
  }
}

export function createCatalogActor(input: {
  userId: string;
  organizationId: string;
  permissions: readonly string[];
}): CatalogActor {
  return new CatalogActorImpl(input);
}
