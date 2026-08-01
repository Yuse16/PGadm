import {
  OrganizationDataError,
  OrganizationValidationError,
} from "./organization-errors";

export const ORGANIZATION_STATUSES = ["active", "inactive"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const EXTERNAL_SOURCES = ["intelisis"] as const;
export type ExternalSource = (typeof EXTERNAL_SOURCES)[number];

export interface Organization {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  status: OrganizationStatus;
  timezone: string;
  currency: string;
  language: string;
  externalSource: ExternalSource | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isOrganizationStatus(value: unknown): value is OrganizationStatus {
  return (
    typeof value === "string" &&
    (ORGANIZATION_STATUSES as readonly string[]).includes(value)
  );
}

export function assertOrganizationStatus(
  value: unknown,
  context: string
): OrganizationStatus {
  if (!isOrganizationStatus(value)) {
    throw new OrganizationDataError(
      `Invalid organization status in ${context}: ${String(value)}`
    );
  }
  return value;
}

export function isExternalSource(value: string | null): value is ExternalSource {
  return value !== null && (EXTERNAL_SOURCES as readonly string[]).includes(value);
}

export function assertExternalSource(value: string | null, context: string): ExternalSource | null {
  if (value === null) {
    return null;
  }
  if (!isExternalSource(value)) {
    throw new OrganizationDataError(
      `Unknown external source in ${context}: ${value}`
    );
  }
  return value;
}

export function validateCode(code: string, field: string): string {
  if (code === "" || code !== code.trim()) {
    throw new OrganizationValidationError(
      `Invalid ${field}: expected a non-blank, trimmed code but received "${code}"`
    );
  }
  return code;
}

export function validateOrganizationCode(code: string): string {
  return validateCode(code, "organization code");
}
