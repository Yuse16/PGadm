import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type {
  BranchReference,
  LayoutReferenceCatalog,
  VariantReference,
  WarehouseReference,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import { SupabaseProductRepository } from "../../catalog/infrastructure/supabase-catalog-repository";

/**
 * Supabase reference catalog for layout use cases (3.4). Branches are looked up
 * in `public.branches` (only branch_type='store' qualifies, D-L01); variants
 * reuse the catalog repository (org-scoped, D-C08); warehouses come from
 * `public.warehouses` and `public.branch_warehouse_relations`, keeping the
 * store backroom and the CEDIS separated (D-L13). Always one source of truth:
 * the database through the RLS-scoped client, never a client payload.
 */
export class SupabaseLayoutReferenceCatalog implements LayoutReferenceCatalog {
  async findBranchById(
    organizationId: string,
    branchId: string
  ): Promise<BranchReference | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("branches")
      .select("id, code, branch_type")
      .eq("organization_id", organizationId)
      .eq("id", branchId)
      .eq("branch_type", "store")
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find branch reference: ${error.message}`);
    }
    if (data === null) {
      return null;
    }
    return { id: data.id, code: data.code, branchType: data.branch_type };
  }

  async findVariantById(
    organizationId: string,
    variantId: string
  ): Promise<VariantReference | null> {
    const variant = await new SupabaseProductRepository().findVariantById(
      organizationId,
      variantId
    );
    return variant ? { id: variant.id, sku: variant.sku } : null;
  }

  async findWarehouseById(
    organizationId: string,
    warehouseId: string
  ): Promise<WarehouseReference | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("warehouses")
      .select("id, code, warehouse_type")
      .eq("organization_id", organizationId)
      .eq("id", warehouseId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find warehouse reference: ${error.message}`);
    }
    if (data === null) {
      return null;
    }
    return {
      id: data.id,
      code: data.code,
      warehouseType: data.warehouse_type,
    };
  }

  async findWarehousesForBranch(
    organizationId: string,
    branchId: string
  ): Promise<WarehouseReference[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("branch_warehouse_relations")
      .select("warehouse_id, warehouses(id, code, warehouse_type)")
      .eq("organization_id", organizationId)
      .eq("branch_id", branchId)
      .eq("active", true);
    if (error) {
      throw new Error(`Failed to find warehouses for branch: ${error.message}`);
    }
    return data
      .map((relation) => relation.warehouses)
      .filter((warehouse): warehouse is NonNullable<typeof warehouse> => warehouse !== null)
      .map((warehouse) => ({
        id: warehouse.id,
        code: warehouse.code,
        warehouseType: warehouse.warehouse_type,
      }));
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}
