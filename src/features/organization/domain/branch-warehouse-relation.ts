import {
  assertOrganizationStatus,
  type OrganizationStatus,
} from "./organization";
import { OrganizationDataError } from "./organization-errors";

export const RELATIONSHIP_TYPES = ["supply"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface BranchWarehouseRelation {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  relationshipType: RelationshipType;
  priority: number;
  active: boolean;
  validFrom: string;
  validTo: string | null;
  specialRules: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationStructure {
  organization: {
    id: string;
    code: string;
    name: string;
    legalName: string | null;
    status: OrganizationStatus;
    timezone: string;
    currency: string;
    language: string;
  };
  branches: Array<{
    id: string;
    code: string;
    name: string;
    branchType: string;
    status: OrganizationStatus;
    warehouses: Array<{
      id: string;
      code: string;
      name: string;
      warehouseType: string;
      status: OrganizationStatus;
      isPrimary: boolean;
    }>;
  }>;
}

export function isRelationshipType(value: string): value is RelationshipType {
  return (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

export function assertRelationshipType(value: string, context: string): RelationshipType {
  if (!isRelationshipType(value)) {
    throw new OrganizationDataError(
      `Invalid relationship type in ${context}: ${value}`
    );
  }
  return value;
}

export function assertRelationshipPriority(priority: number, context: string): number {
  if (!Number.isInteger(priority) || priority < 1) {
    throw new OrganizationDataError(
      `Invalid relationship priority in ${context}: expected a positive integer but received ${priority}`
    );
  }
  return priority;
}

export function assertRelationStatus(value: unknown, context: string): OrganizationStatus {
  return assertOrganizationStatus(value, context);
}
