/**
 * Typed error hierarchy for the product catalog feature.
 * Mirrors the organization/identity error pattern: one base class plus
 * specialized subclasses so use cases and controllers can branch on errors
 * without string matching.
 */
export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogError";
  }
}

export class CatalogNotFoundError extends CatalogError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "CatalogNotFoundError";
  }
}

export class CatalogValidationError extends CatalogError {
  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

export class CatalogDataError extends CatalogError {
  constructor(message: string) {
    super(message);
    this.name = "CatalogDataError";
  }
}

export class CatalogPermissionError extends CatalogError {
  constructor(permissionCode: string) {
    super(`Missing catalog permission: ${permissionCode}`);
    this.name = "CatalogPermissionError";
  }
}

/**
 * Raised when an operation is valid in a product requirement but impossible
 * under the approved data model. RemoveBarcode uses this: product_barcodes
 * has no status column and D-C14 forbids physical DELETE, so a barcode can
 * never be removed — only re-pointed via ChangePrimaryBarcode.
 */
export class CatalogUnsupportedOperationError extends CatalogError {
  constructor(message: string) {
    super(message);
    this.name = "CatalogUnsupportedOperationError";
  }
}

export class RepositoryConfigurationError extends CatalogError {
  constructor(message?: string) {
    super(
      message ??
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to query a database."
    );
    this.name = "RepositoryConfigurationError";
  }
}
