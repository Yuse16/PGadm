import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type {
  InventoryReferenceCatalog,
  VariantReference,
  WarehouseReference,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import { SupabaseProductRepository } from "../../catalog/infrastructure/supabase-catalog-repository";

/**
 * Supabase reference catalog for inventory use cases. Variants reuse the
 * catalog repository (org-scoped, D-C08); warehouses are looked up directly in
 * `public.warehouses` through the RLS-scoped client (org members read their own
 * warehouses). Always one source of truth: the database, never a client payload.
 */
export class SupabaseInventoryReferenceCatalog implements InventoryReferenceCatalog {
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
      .select("id, code")
      .eq("organization_id", organizationId)
      .eq("id", warehouseId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find warehouse reference: ${error.message}`);
    }
    return data ? { id: data.id, code: data.code } : null;
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}
