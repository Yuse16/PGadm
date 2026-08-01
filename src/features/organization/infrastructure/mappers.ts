import type { Database } from "@/types/database";

type OrganizationsRow = Database["public"]["Tables"]["organizations"]["Row"];
type BranchesRow = Database["public"]["Tables"]["branches"]["Row"];
type WarehousesRow = Database["public"]["Tables"]["warehouses"]["Row"];
type BranchWarehouseRelationsRow =
  Database["public"]["Tables"]["branch_warehouse_relations"]["Row"];
import {
  assertBranchType,
  assertExternalSource,
  assertOrganizationStatus,
  assertRelationshipType,
  assertWarehouseType,
} from "../domain";
import type {
  Branch,
  BranchWarehouseRelation,
  Organization,
  Warehouse,
} from "../domain";

export function mapOrganization(row: OrganizationsRow): Organization {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    legalName: row.legal_name,
    status: assertOrganizationStatus(row.status, "organizations.status"),
    timezone: row.timezone,
    currency: row.currency,
    language: row.language,
    externalSource: assertExternalSource(row.external_source, "organizations.external_source"),
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBranch(row: BranchesRow): Branch {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    branchType: assertBranchType(row.branch_type, "branches.branch_type"),
    status: assertOrganizationStatus(row.status, "branches.status"),
    timezone: row.timezone,
    address: {
      line: row.address_line,
      city: row.city,
      stateProvince: row.state_province,
      postalCode: row.postal_code,
      country: row.country,
    },
    externalSource: assertExternalSource(row.external_source, "branches.external_source"),
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWarehouse(row: WarehousesRow): Warehouse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    warehouseType: assertWarehouseType(row.warehouse_type, "warehouses.warehouse_type"),
    status: assertOrganizationStatus(row.status, "warehouses.status"),
    isPrimary: row.is_primary,
    externalSource: assertExternalSource(row.external_source, "warehouses.external_source"),
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBranchWarehouseRelation(
  row: BranchWarehouseRelationsRow
): BranchWarehouseRelation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    warehouseId: row.warehouse_id,
    relationshipType: assertRelationshipType(
      row.relationship_type,
      "branch_warehouse_relations.relationship_type"
    ),
    priority: row.priority,
    active: row.active,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    specialRules: row.special_rules,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
