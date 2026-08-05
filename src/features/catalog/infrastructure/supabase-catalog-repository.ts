import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database } from "@/types/database";
import type {
  Barcode,
  Brand,
  Category,
  Product,
  ProductLine,
  ProductListOptions,
  Unit,
  Variant,
} from "../domain";
import type {
  BrandRepository,
  CategoryRepository,
  ProductLineRepository,
  ProductRepository,
  UnitRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import {
  mapBarcode,
  mapBrand,
  mapCategory,
  mapProduct,
  mapProductLine,
  mapUnit,
  mapVariant,
} from "./mappers";

const PRODUCT_COLUMNS =
  "id, organization_id, external_id, description, short_name, brand_id, category_id, line_id, technical_description, status, created_at, updated_at" as const;

const VARIANT_COLUMNS =
  "id, organization_id, product_id, sku, display_name, format, finish, base_unit_id, sale_unit_id, base_units_per_sale_unit, pieces_per_box, square_meters_per_box, reference_price, status, created_at, updated_at" as const;

const BARCODE_COLUMNS =
  "id, organization_id, variant_id, barcode, is_primary, created_at, updated_at" as const;

const CATEGORY_COLUMNS =
  "id, organization_id, parent_id, code, name, status, created_at, updated_at" as const;

const BRAND_COLUMNS =
  "id, organization_id, code, name, status, created_at, updated_at" as const;

const LINE_COLUMNS =
  "id, organization_id, external_id, name, status, created_at, updated_at" as const;

const UNIT_COLUMNS =
  "id, organization_id, code, name, kind, status, created_at, updated_at" as const;

type ProductsInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductVariantsInsert = Database["public"]["Tables"]["product_variants"]["Insert"];
type ProductBarcodesInsert = Database["public"]["Tables"]["product_barcodes"]["Insert"];
type ProductCategoriesInsert =
  Database["public"]["Tables"]["product_categories"]["Insert"];
type ProductBrandsInsert = Database["public"]["Tables"]["product_brands"]["Insert"];
type ProductLinesInsert = Database["public"]["Tables"]["product_lines"]["Insert"];
type UnitsOfMeasureInsert = Database["public"]["Tables"]["units_of_measure"]["Insert"];

type ProductsUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductVariantsUpdate =
  Database["public"]["Tables"]["product_variants"]["Update"];
type ProductBarcodesUpdate =
  Database["public"]["Tables"]["product_barcodes"]["Update"];
type ProductCategoriesUpdate =
  Database["public"]["Tables"]["product_categories"]["Update"];
type ProductBrandsUpdate = Database["public"]["Tables"]["product_brands"]["Update"];
type ProductLinesUpdate = Database["public"]["Tables"]["product_lines"]["Update"];
type UnitsOfMeasureUpdate = Database["public"]["Tables"]["units_of_measure"]["Update"];

export class SupabaseProductRepository implements ProductRepository {
  async findProductById(
    organizationId: string,
    productId: string
  ): Promise<Product | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", productId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
    return data === null ? null : mapProduct(data);
  }

  async findProductByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<Product | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("external_id", externalId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch product by external_id: ${error.message}`);
    }
    return data === null ? null : mapProduct(data);
  }

  async listProducts(
    organizationId: string,
    options?: ProductListOptions
  ): Promise<Product[]> {
    const client = await this.createClient();
    let query = client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("organization_id", organizationId)
      .order("description", { ascending: true });
    if (options?.status !== undefined) {
      query = query.eq("status", options.status);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list products: ${error.message}`);
    }
    return data.map(mapProduct);
  }

  async searchProducts(
    organizationId: string,
    query: string
  ): Promise<Product[]> {
    const client = await this.createClient();
    const escaped = escapeLike(query);
    const { data, error } = await client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("organization_id", organizationId)
      .or(
        `description.ilike.%${escaped}%,short_name.ilike.%${escaped}%,external_id.ilike.%${escaped}%`
      )
      .order("description", { ascending: true });
    if (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }
    return data.map(mapProduct);
  }

  async listVariantsByProduct(
    organizationId: string,
    productId: string
  ): Promise<Variant[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_variants")
      .select(VARIANT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("product_id", productId)
      .order("sku", { ascending: true });
    if (error) {
      throw new Error(`Failed to list variants: ${error.message}`);
    }
    return data.map(mapVariant);
  }

  async findVariantById(
    organizationId: string,
    variantId: string
  ): Promise<Variant | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_variants")
      .select(VARIANT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", variantId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch variant: ${error.message}`);
    }
    return data === null ? null : mapVariant(data);
  }

  async findVariantBySku(
    organizationId: string,
    sku: string
  ): Promise<Variant | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_variants")
      .select(VARIANT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("sku", sku)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch variant by sku: ${error.message}`);
    }
    return data === null ? null : mapVariant(data);
  }

  async listBarcodesByVariant(
    organizationId: string,
    variantId: string
  ): Promise<Barcode[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_barcodes")
      .select(BARCODE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("variant_id", variantId)
      .order("is_primary", { ascending: false });
    if (error) {
      throw new Error(`Failed to list barcodes: ${error.message}`);
    }
    return data.map(mapBarcode);
  }

  async findBarcodeByValue(
    organizationId: string,
    barcode: string
  ): Promise<Barcode | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_barcodes")
      .select(BARCODE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("barcode", barcode)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch barcode by value: ${error.message}`);
    }
    return data === null ? null : mapBarcode(data);
  }

  async insertProduct(product: Product): Promise<Product> {
    const client = await this.createClient();
    const row: ProductsInsert = {
      id: product.id,
      organization_id: product.organizationId,
      external_id: product.externalId,
      description: product.description,
      short_name: product.shortName,
      brand_id: product.brandId,
      category_id: product.categoryId,
      line_id: product.lineId,
      technical_description: product.technicalDescription,
      status: product.status,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    };
    const { data, error } = await client
      .from("products")
      .insert(row)
      .select(PRODUCT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert product: ${error.message}`);
    }
    return mapProduct(data);
  }

  async updateProduct(product: Product): Promise<Product> {
    const client = await this.createClient();
    const row: ProductsUpdate = {
      external_id: product.externalId,
      description: product.description,
      short_name: product.shortName,
      brand_id: product.brandId,
      category_id: product.categoryId,
      line_id: product.lineId,
      technical_description: product.technicalDescription,
      status: product.status,
      updated_at: product.updatedAt,
    };
    const { data, error } = await client
      .from("products")
      .update(row)
      .eq("organization_id", product.organizationId)
      .eq("id", product.id)
      .select(PRODUCT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
    return mapProduct(data);
  }

  async insertVariant(variant: Variant): Promise<Variant> {
    const client = await this.createClient();
    const row: ProductVariantsInsert = {
      id: variant.id,
      organization_id: variant.organizationId,
      product_id: variant.productId,
      sku: variant.sku,
      display_name: variant.displayName,
      format: variant.format,
      finish: variant.finish,
      base_unit_id: variant.baseUnitId,
      sale_unit_id: variant.saleUnitId,
      base_units_per_sale_unit: variant.baseUnitsPerSaleUnit,
      pieces_per_box: variant.piecesPerBox,
      square_meters_per_box: variant.squareMetersPerBox,
      reference_price: variant.referencePrice,
      status: variant.status,
      created_at: variant.createdAt,
      updated_at: variant.updatedAt,
    };
    const { data, error } = await client
      .from("product_variants")
      .insert(row)
      .select(VARIANT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert variant: ${error.message}`);
    }
    return mapVariant(data);
  }

  async updateVariant(variant: Variant): Promise<Variant> {
    const client = await this.createClient();
    const row: ProductVariantsUpdate = {
      sku: variant.sku,
      display_name: variant.displayName,
      format: variant.format,
      finish: variant.finish,
      base_unit_id: variant.baseUnitId,
      sale_unit_id: variant.saleUnitId,
      base_units_per_sale_unit: variant.baseUnitsPerSaleUnit,
      pieces_per_box: variant.piecesPerBox,
      square_meters_per_box: variant.squareMetersPerBox,
      reference_price: variant.referencePrice,
      status: variant.status,
      updated_at: variant.updatedAt,
    };
    const { data, error } = await client
      .from("product_variants")
      .update(row)
      .eq("organization_id", variant.organizationId)
      .eq("id", variant.id)
      .select(VARIANT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update variant: ${error.message}`);
    }
    return mapVariant(data);
  }

  async insertBarcode(barcode: Barcode): Promise<Barcode> {
    const client = await this.createClient();
    const row: ProductBarcodesInsert = {
      id: barcode.id,
      organization_id: barcode.organizationId,
      variant_id: barcode.variantId,
      barcode: barcode.barcode,
      is_primary: barcode.isPrimary,
      created_at: barcode.createdAt,
      updated_at: barcode.updatedAt,
    };
    const { data, error } = await client
      .from("product_barcodes")
      .insert(row)
      .select(BARCODE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert barcode: ${error.message}`);
    }
    return mapBarcode(data);
  }

  async updateBarcode(barcode: Barcode): Promise<Barcode> {
    const client = await this.createClient();
    const row: ProductBarcodesUpdate = {
      is_primary: barcode.isPrimary,
      updated_at: barcode.updatedAt,
    };
    const { data, error } = await client
      .from("product_barcodes")
      .update(row)
      .eq("organization_id", barcode.organizationId)
      .eq("id", barcode.id)
      .select(BARCODE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update barcode: ${error.message}`);
    }
    return mapBarcode(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

export class SupabaseCategoryRepository implements CategoryRepository {
  async findCategoryById(
    organizationId: string,
    categoryId: string
  ): Promise<Category | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_categories")
      .select(CATEGORY_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", categoryId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
    return data === null ? null : mapCategory(data);
  }

  async findCategoryByCode(
    organizationId: string,
    code: string
  ): Promise<Category | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_categories")
      .select(CATEGORY_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("code", code)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch category by code: ${error.message}`);
    }
    return data === null ? null : mapCategory(data);
  }

  async listCategories(organizationId: string): Promise<Category[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_categories")
      .select(CATEGORY_COLUMNS)
      .eq("organization_id", organizationId)
      .order("code", { ascending: true });
    if (error) {
      throw new Error(`Failed to list categories: ${error.message}`);
    }
    return data.map(mapCategory);
  }

  async insertCategory(category: Category): Promise<Category> {
    const client = await this.createClient();
    const row: ProductCategoriesInsert = {
      id: category.id,
      organization_id: category.organizationId,
      parent_id: category.parentId,
      code: category.code,
      name: category.name,
      status: category.status,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    };
    const { data, error } = await client
      .from("product_categories")
      .insert(row)
      .select(CATEGORY_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert category: ${error.message}`);
    }
    return mapCategory(data);
  }

  async updateCategory(category: Category): Promise<Category> {
    const client = await this.createClient();
    const row: ProductCategoriesUpdate = {
      parent_id: category.parentId,
      code: category.code,
      name: category.name,
      status: category.status,
      updated_at: category.updatedAt,
    };
    const { data, error } = await client
      .from("product_categories")
      .update(row)
      .eq("organization_id", category.organizationId)
      .eq("id", category.id)
      .select(CATEGORY_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    return mapCategory(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

export class SupabaseBrandRepository implements BrandRepository {
  async findBrandById(
    organizationId: string,
    brandId: string
  ): Promise<Brand | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_brands")
      .select(BRAND_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", brandId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch brand: ${error.message}`);
    }
    return data === null ? null : mapBrand(data);
  }

  async findBrandByCode(
    organizationId: string,
    code: string
  ): Promise<Brand | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_brands")
      .select(BRAND_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("code", code)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch brand by code: ${error.message}`);
    }
    return data === null ? null : mapBrand(data);
  }

  async listBrands(organizationId: string): Promise<Brand[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_brands")
      .select(BRAND_COLUMNS)
      .eq("organization_id", organizationId)
      .order("code", { ascending: true });
    if (error) {
      throw new Error(`Failed to list brands: ${error.message}`);
    }
    return data.map(mapBrand);
  }

  async insertBrand(brand: Brand): Promise<Brand> {
    const client = await this.createClient();
    const row: ProductBrandsInsert = {
      id: brand.id,
      organization_id: brand.organizationId,
      code: brand.code,
      name: brand.name,
      status: brand.status,
      created_at: brand.createdAt,
      updated_at: brand.updatedAt,
    };
    const { data, error } = await client
      .from("product_brands")
      .insert(row)
      .select(BRAND_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert brand: ${error.message}`);
    }
    return mapBrand(data);
  }

  async updateBrand(brand: Brand): Promise<Brand> {
    const client = await this.createClient();
    const row: ProductBrandsUpdate = {
      code: brand.code,
      name: brand.name,
      status: brand.status,
      updated_at: brand.updatedAt,
    };
    const { data, error } = await client
      .from("product_brands")
      .update(row)
      .eq("organization_id", brand.organizationId)
      .eq("id", brand.id)
      .select(BRAND_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update brand: ${error.message}`);
    }
    return mapBrand(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

export class SupabaseProductLineRepository implements ProductLineRepository {
  async findProductLineById(
    organizationId: string,
    lineId: string
  ): Promise<ProductLine | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_lines")
      .select(LINE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", lineId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch product line: ${error.message}`);
    }
    return data === null ? null : mapProductLine(data);
  }

  async findProductLineByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<ProductLine | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_lines")
      .select(LINE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("external_id", externalId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch product line by external_id: ${error.message}`);
    }
    return data === null ? null : mapProductLine(data);
  }

  async listProductLines(organizationId: string): Promise<ProductLine[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("product_lines")
      .select(LINE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });
    if (error) {
      throw new Error(`Failed to list product lines: ${error.message}`);
    }
    return data.map(mapProductLine);
  }

  async insertProductLine(line: ProductLine): Promise<ProductLine> {
    const client = await this.createClient();
    const row: ProductLinesInsert = {
      id: line.id,
      organization_id: line.organizationId,
      external_id: line.externalId,
      name: line.name,
      status: line.status,
      created_at: line.createdAt,
      updated_at: line.updatedAt,
    };
    const { data, error } = await client
      .from("product_lines")
      .insert(row)
      .select(LINE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert product line: ${error.message}`);
    }
    return mapProductLine(data);
  }

  async updateProductLine(line: ProductLine): Promise<ProductLine> {
    const client = await this.createClient();
    const row: ProductLinesUpdate = {
      external_id: line.externalId,
      name: line.name,
      status: line.status,
      updated_at: line.updatedAt,
    };
    const { data, error } = await client
      .from("product_lines")
      .update(row)
      .eq("organization_id", line.organizationId)
      .eq("id", line.id)
      .select(LINE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update product line: ${error.message}`);
    }
    return mapProductLine(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

export class SupabaseUnitRepository implements UnitRepository {
  async findUnitById(
    organizationId: string,
    unitId: string
  ): Promise<Unit | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("units_of_measure")
      .select(UNIT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", unitId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch unit: ${error.message}`);
    }
    return data === null ? null : mapUnit(data);
  }

  async findUnitByCode(
    organizationId: string,
    code: string
  ): Promise<Unit | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("units_of_measure")
      .select(UNIT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("code", code)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch unit by code: ${error.message}`);
    }
    return data === null ? null : mapUnit(data);
  }

  async listUnits(organizationId: string): Promise<Unit[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("units_of_measure")
      .select(UNIT_COLUMNS)
      .eq("organization_id", organizationId)
      .order("code", { ascending: true });
    if (error) {
      throw new Error(`Failed to list units: ${error.message}`);
    }
    return data.map(mapUnit);
  }

  async insertUnit(unit: Unit): Promise<Unit> {
    const client = await this.createClient();
    const row: UnitsOfMeasureInsert = {
      id: unit.id,
      organization_id: unit.organizationId,
      code: unit.code,
      name: unit.name,
      kind: unit.kind,
      status: unit.status,
      created_at: unit.createdAt,
      updated_at: unit.updatedAt,
    };
    const { data, error } = await client
      .from("units_of_measure")
      .insert(row)
      .select(UNIT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert unit: ${error.message}`);
    }
    return mapUnit(data);
  }

  async updateUnit(unit: Unit): Promise<Unit> {
    const client = await this.createClient();
    const row: UnitsOfMeasureUpdate = {
      code: unit.code,
      name: unit.name,
      kind: unit.kind,
      status: unit.status,
      updated_at: unit.updatedAt,
    };
    const { data, error } = await client
      .from("units_of_measure")
      .update(row)
      .eq("organization_id", unit.organizationId)
      .eq("id", unit.id)
      .select(UNIT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update unit: ${error.message}`);
    }
    return mapUnit(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
