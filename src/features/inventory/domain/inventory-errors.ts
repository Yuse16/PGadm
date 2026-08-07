/**
 * Typed error hierarchy for the inventory feature.
 * Mirrors the catalog/organization error pattern: one base class plus
 * specialized subclasses so use cases and controllers can branch on errors
 * without string matching.
 */
export class InventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryError";
  }
}

export class InventoryNotFoundError extends InventoryError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "InventoryNotFoundError";
  }
}

export class InventoryValidationError extends InventoryError {
  constructor(message: string) {
    super(message);
    this.name = "InventoryValidationError";
  }
}

export class InventoryDataError extends InventoryError {
  constructor(message: string) {
    super(message);
    this.name = "InventoryDataError";
  }
}

export class InventoryPermissionError extends InventoryError {
  constructor(permissionCode: string) {
    super(`Missing inventory permission: ${permissionCode}`);
    this.name = "InventoryPermissionError";
  }
}

export class RepositoryConfigurationError extends InventoryError {
  constructor(message?: string) {
    super(
      message ??
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to query a database."
    );
    this.name = "RepositoryConfigurationError";
  }
}
