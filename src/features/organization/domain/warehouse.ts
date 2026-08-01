import {
  validateCode,
  type ExternalSource,
  type OrganizationStatus,
} from "./organization";
import { OrganizationDataError, OrganizationValidationError } from "./organization-errors";

export const WAREHOUSE_TYPES = ["store_backroom", "distribution"] as const;
export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];

export interface Warehouse {
  id: string;
  organizationId: string;
  branchId: string;
  code: string;
  name: string;
  warehouseType: WarehouseType;
  status: OrganizationStatus;
  isPrimary: boolean;
  externalSource: ExternalSource | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isWarehouseType(value: string): value is WarehouseType {
  return (WAREHOUSE_TYPES as readonly string[]).includes(value);
}

export function assertWarehouseType(value: string, context: string): WarehouseType {
  if (!isWarehouseType(value)) {
    throw new OrganizationDataError(
      `Invalid warehouse type in ${context}: ${value}`
    );
  }
  return value;
}

export function validateWarehouseCode(code: string): string {
  return validateCode(code, "warehouse code");
}

export function validateWarehouseName(name: string): string {
  if (name === "" || name !== name.trim()) {
    throw new OrganizationValidationError(
      `Invalid warehouse name: expected a non-blank, trimmed name but received "${name}"`
    );
  }
  return name;
}
