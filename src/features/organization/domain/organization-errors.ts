export class OrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationError";
  }
}

export class OrganizationNotFoundError extends OrganizationError {
  constructor(organizationId: string) {
    super(`Organization not found: ${organizationId}`);
    this.name = "OrganizationNotFoundError";
  }
}

export class OrganizationValidationError extends OrganizationError {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationValidationError";
  }
}

export class OrganizationDataError extends OrganizationError {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationDataError";
  }
}

export class RepositoryConfigurationError extends OrganizationError {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to query a database."
    );
    this.name = "RepositoryConfigurationError";
  }
}
