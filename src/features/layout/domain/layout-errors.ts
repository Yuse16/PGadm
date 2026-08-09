/**
 * Typed error hierarchy for the layout feature.
 * Mirrors the catalog/inventory error pattern: one base class plus
 * specialized subclasses so use cases and controllers can branch on errors
 * without string matching.
 */
export class LayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutError";
  }
}

export class LayoutNotFoundError extends LayoutError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "LayoutNotFoundError";
  }
}

export class LayoutValidationError extends LayoutError {
  constructor(message: string) {
    super(message);
    this.name = "LayoutValidationError";
  }
}

export class LayoutDataError extends LayoutError {
  constructor(message: string) {
    super(message);
    this.name = "LayoutDataError";
  }
}

export class LayoutPermissionError extends LayoutError {
  constructor(permissionCode: string) {
    super(`Missing layout permission: ${permissionCode}`);
    this.name = "LayoutPermissionError";
  }
}

export class RepositoryConfigurationError extends LayoutError {
  constructor(message?: string) {
    super(
      message ??
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to query a database."
    );
    this.name = "RepositoryConfigurationError";
  }
}
