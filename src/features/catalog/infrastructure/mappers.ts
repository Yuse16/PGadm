import type { Database } from "@/types/database";
import {
  assertProductStatus,
  assertReferenceStatus,
  assertUnitKind,
} from "../domain";
import type {
  Barcode,
  Brand,
  Category,
  Product,
  ProductLine,
  Unit,
  Variant,
} from "../domain";

type ProductsRow = Database["public"]["Tables"]["products"]["Row"];
type ProductVariantsRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductBarcodesRow = Database["public"]["Tables"]["product_barcodes"]["Row"];
type ProductCategoriesRow = Database["public"]["Tables"]["product_categories"]["Row"];
type ProductBrandsRow = Database["public"]["Tables"]["product_brands"]["Row"];
type ProductLinesRow = Database["public"]["Tables"]["product_lines"]["Row"];
type UnitsOfMeasureRow = Database["public"]["Tables"]["units_of_measure"]["Row"];

export function mapProduct(row: ProductsRow): Product {
  return {
    id: row.id,
    organizationId: row.organization_id,
    externalId: row.external_id,
    description: row.description,
    shortName: row.short_name,
    brandId: row.brand_id,
    categoryId: row.category_id,
    lineId: row.line_id,
    technicalDescription: row.technical_description,
    status: assertProductStatus(row.status, "products.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVariant(row: ProductVariantsRow): Variant {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    sku: row.sku,
    displayName: row.display_name,
    format: row.format,
    finish: row.finish,
    baseUnitId: row.base_unit_id,
    saleUnitId: row.sale_unit_id,
    baseUnitsPerSaleUnit: row.base_units_per_sale_unit,
    piecesPerBox: row.pieces_per_box,
    squareMetersPerBox: row.square_meters_per_box,
    referencePrice: row.reference_price,
    status: assertProductStatus(row.status, "product_variants.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBarcode(row: ProductBarcodesRow): Barcode {
  return {
    id: row.id,
    organizationId: row.organization_id,
    variantId: row.variant_id,
    barcode: row.barcode,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategory(row: ProductCategoriesRow): Category {
  return {
    id: row.id,
    organizationId: row.organization_id,
    parentId: row.parent_id,
    code: row.code,
    name: row.name,
    status: assertReferenceStatus(row.status, "product_categories.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBrand(row: ProductBrandsRow): Brand {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    status: assertReferenceStatus(row.status, "product_brands.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductLine(row: ProductLinesRow): ProductLine {
  return {
    id: row.id,
    organizationId: row.organization_id,
    externalId: row.external_id,
    name: row.name,
    status: assertReferenceStatus(row.status, "product_lines.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUnit(row: UnitsOfMeasureRow): Unit {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    kind: assertUnitKind(row.kind, "units_of_measure.kind"),
    status: assertReferenceStatus(row.status, "units_of_measure.status"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
