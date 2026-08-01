import {
  validateCode,
  type ExternalSource,
  type OrganizationStatus,
} from "./organization";
import { OrganizationDataError, OrganizationValidationError } from "./organization-errors";

export const BRANCH_TYPES = ["store", "distribution_center", "office"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export interface BranchAddress {
  line: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  branchType: BranchType;
  status: OrganizationStatus;
  timezone: string | null;
  address: BranchAddress;
  externalSource: ExternalSource | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isBranchType(value: string): value is BranchType {
  return (BRANCH_TYPES as readonly string[]).includes(value);
}

export function assertBranchType(value: string, context: string): BranchType {
  if (!isBranchType(value)) {
    throw new OrganizationDataError(
      `Invalid branch type in ${context}: ${value}`
    );
  }
  return value;
}

export function validateBranchCode(code: string): string {
  return validateCode(code, "branch code");
}

export function validateBranchName(name: string): string {
  if (name === "" || name !== name.trim()) {
    throw new OrganizationValidationError(
      `Invalid branch name: expected a non-blank, trimmed name but received "${name}"`
    );
  }
  return name;
}
