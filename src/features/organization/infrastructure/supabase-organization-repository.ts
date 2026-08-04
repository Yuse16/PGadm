import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type {
  Organization,
  OrganizationRepository,
  Branch,
  BranchWarehouseRelation,
  Warehouse,
} from "../domain";
import { OrganizationNotFoundError, RepositoryConfigurationError } from "../domain";
import {
  mapBranch,
  mapBranchWarehouseRelation,
  mapOrganization,
  mapWarehouse,
} from "./mappers";

const ORGANIZATION_COLUMNS =
  "id, code, name, legal_name, status, timezone, currency, language, external_source, external_id, created_at, updated_at" as const;

const BRANCH_COLUMNS =
  "id, organization_id, code, name, branch_type, status, timezone, address_line, city, state_province, postal_code, country, external_source, external_id, created_at, updated_at" as const;

const WAREHOUSE_COLUMNS =
  "id, organization_id, branch_id, code, name, warehouse_type, status, is_primary, external_source, external_id, created_at, updated_at" as const;

const RELATION_COLUMNS =
  "id, organization_id, branch_id, warehouse_id, relationship_type, priority, active, valid_from, valid_to, special_rules, created_at, updated_at" as const;

export class SupabaseOrganizationRepository implements OrganizationRepository {
  async findOrganizationById(organizationId: string): Promise<Organization> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("organizations")
      .select(ORGANIZATION_COLUMNS)
      .eq("id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    if (data === null) {
      throw new OrganizationNotFoundError(organizationId);
    }

    return mapOrganization(data);
  }

  async findOrganizationByCode(code: string): Promise<Organization> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("organizations")
      .select(ORGANIZATION_COLUMNS)
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    if (data === null) {
      throw new OrganizationNotFoundError(code);
    }

    return mapOrganization(data);
  }

  async listBranchesByOrganization(organizationId: string): Promise<Branch[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("branches")
      .select(BRANCH_COLUMNS)
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }

    return data.map(mapBranch);
  }

  async listWarehousesByBranch(branchId: string): Promise<Warehouse[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("warehouses")
      .select(WAREHOUSE_COLUMNS)
      .eq("branch_id", branchId)
      .order("is_primary", { ascending: false })
      .order("code", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch warehouses: ${error.message}`);
    }

    return data.map(mapWarehouse);
  }

  async listBranchWarehouseRelations(
    organizationId: string
  ): Promise<BranchWarehouseRelation[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("branch_warehouse_relations")
      .select(RELATION_COLUMNS)
      .eq("organization_id", organizationId)
      .order("priority", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch branch warehouse relations: ${error.message}`);
    }

    return data.map(mapBranchWarehouseRelation);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}
