import { CatalogNotFoundError } from "./catalog-errors";
import type { ProductListOptions } from "./product";
import type { Barcode } from "./barcode";
import type { Brand } from "./brand";
import type { Category } from "./category";
import type { ProductLine } from "./product-line";
import type { Product } from "./product";
import type { Unit } from "./unit";
import type { Variant } from "./variant";

/**
 * Product aggregate repository (products + variants + barcodes, D-C02/D-C03).
 * All methods are org-scoped: callers must pass the organization that owns the
 * data; a mismatch is a not-found, never a cross-org read (D-C07).
 */
export interface ProductRepository {
  findProductById(organizationId: string, productId: string): Promise<Product | null>;
  findProductByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<Product | null>;
  listProducts(
    organizationId: string,
    options?: ProductListOptions
  ): Promise<Product[]>;
  searchProducts(organizationId: string, query: string): Promise<Product[]>;

  listVariantsByProduct(
    organizationId: string,
    productId: string
  ): Promise<Variant[]>;
  findVariantById(organizationId: string, variantId: string): Promise<Variant | null>;
  findVariantBySku(organizationId: string, sku: string): Promise<Variant | null>;
  listBarcodesByVariant(
    organizationId: string,
    variantId: string
  ): Promise<Barcode[]>;
  findBarcodeByValue(organizationId: string, barcode: string): Promise<Barcode | null>;

  insertProduct(product: Product): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  insertVariant(variant: Variant): Promise<Variant>;
  updateVariant(variant: Variant): Promise<Variant>;
  insertBarcode(barcode: Barcode): Promise<Barcode>;
  updateBarcode(barcode: Barcode): Promise<Barcode>;
}

export interface CategoryRepository {
  findCategoryById(
    organizationId: string,
    categoryId: string
  ): Promise<Category | null>;
  findCategoryByCode(organizationId: string, code: string): Promise<Category | null>;
  listCategories(organizationId: string): Promise<Category[]>;
  insertCategory(category: Category): Promise<Category>;
  updateCategory(category: Category): Promise<Category>;
}

export interface BrandRepository {
  findBrandById(organizationId: string, brandId: string): Promise<Brand | null>;
  findBrandByCode(organizationId: string, code: string): Promise<Brand | null>;
  listBrands(organizationId: string): Promise<Brand[]>;
  insertBrand(brand: Brand): Promise<Brand>;
  updateBrand(brand: Brand): Promise<Brand>;
}

export interface ProductLineRepository {
  findProductLineById(
    organizationId: string,
    lineId: string
  ): Promise<ProductLine | null>;
  findProductLineByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<ProductLine | null>;
  listProductLines(organizationId: string): Promise<ProductLine[]>;
  insertProductLine(line: ProductLine): Promise<ProductLine>;
  updateProductLine(line: ProductLine): Promise<ProductLine>;
}

export interface UnitRepository {
  findUnitById(organizationId: string, unitId: string): Promise<Unit | null>;
  findUnitByCode(organizationId: string, code: string): Promise<Unit | null>;
  listUnits(organizationId: string): Promise<Unit[]>;
  insertUnit(unit: Unit): Promise<Unit>;
  updateUnit(unit: Unit): Promise<Unit>;
}

export function requireEntity<T>(
  value: T | null,
  entity: string,
  id: string
): T {
  if (value === null) {
    throw new CatalogNotFoundError(entity, id);
  }
  return value;
}
