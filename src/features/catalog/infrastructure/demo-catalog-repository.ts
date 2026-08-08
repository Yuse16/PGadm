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
import { CatalogDataError } from "../domain";

/**
 * In-memory repositories used when CATALOG_DATA_SOURCE=demo. They enforce the
 * same org-scoping contract as the Supabase implementation (every method takes
 * organizationId and a mismatch is a miss) without a database. Use cases and
 * tests share this behavior model; the database re-enforces invariants via
 * constraints, RLS and triggers.
 */
export class DemoProductRepository implements ProductRepository {
  products = new Map<string, Product>();
  variants = new Map<string, Variant>();
  barcodes = new Map<string, Barcode>();

  async findProductById(
    organizationId: string,
    productId: string
  ): Promise<Product | null> {
    const product = this.products.get(productId);
    if (product === undefined || product.organizationId !== organizationId) {
      return null;
    }
    return product;
  }

  async findProductByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (
        product.organizationId === organizationId &&
        product.externalId === externalId
      ) {
        return product;
      }
    }
    return null;
  }

  async listProducts(
    organizationId: string,
    options?: ProductListOptions
  ): Promise<Product[]> {
    return [...this.products.values()]
      .filter((product) => {
        if (product.organizationId !== organizationId) {
          return false;
        }
        if (options?.status !== undefined && product.status !== options.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.description.localeCompare(b.description));
  }

  async searchProducts(
    organizationId: string,
    query: string
  ): Promise<Product[]> {
    const needle = query.toLowerCase();
    return this.listProducts(organizationId).then((products) =>
      products.filter((product) =>
        [product.description, product.shortName ?? "", product.externalId ?? ""]
          .some((value) => value.toLowerCase().includes(needle))
      )
    );
  }

  async listVariantsByProduct(
    organizationId: string,
    productId: string
  ): Promise<Variant[]> {
    return [...this.variants.values()]
      .filter(
        (variant) =>
          variant.organizationId === organizationId &&
          variant.productId === productId
      )
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }

  async findVariantById(
    organizationId: string,
    variantId: string
  ): Promise<Variant | null> {
    const variant = this.variants.get(variantId);
    if (variant === undefined || variant.organizationId !== organizationId) {
      return null;
    }
    return variant;
  }

  async findVariantBySku(
    organizationId: string,
    sku: string
  ): Promise<Variant | null> {
    for (const variant of this.variants.values()) {
      if (variant.organizationId === organizationId && variant.sku === sku) {
        return variant;
      }
    }
    return null;
  }

  async listBarcodesByVariant(
    organizationId: string,
    variantId: string
  ): Promise<Barcode[]> {
    return [...this.barcodes.values()]
      .filter(
        (barcode) =>
          barcode.organizationId === organizationId &&
          barcode.variantId === variantId
      )
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  }

  async findBarcodeByValue(
    organizationId: string,
    barcode: string
  ): Promise<Barcode | null> {
    for (const row of this.barcodes.values()) {
      if (row.organizationId === organizationId && row.barcode === barcode) {
        return row;
      }
    }
    return null;
  }

  async insertProduct(product: Product): Promise<Product> {
    this.products.set(product.id, { ...product });
    return product;
  }

  async updateProduct(product: Product): Promise<Product> {
    this.products.set(product.id, { ...product });
    return product;
  }

  async insertVariant(variant: Variant): Promise<Variant> {
    this.variants.set(variant.id, { ...variant });
    return variant;
  }

  async updateVariant(variant: Variant): Promise<Variant> {
    this.variants.set(variant.id, { ...variant });
    return variant;
  }

  async insertBarcode(barcode: Barcode): Promise<Barcode> {
    this.barcodes.set(barcode.id, { ...barcode });
    return barcode;
  }

  async updateBarcode(barcode: Barcode): Promise<Barcode> {
    this.barcodes.set(barcode.id, { ...barcode });
    return barcode;
  }
}

export class DemoCategoryRepository implements CategoryRepository {
  categories = new Map<string, Category>();

  async findCategoryById(
    organizationId: string,
    categoryId: string
  ): Promise<Category | null> {
    const category = this.categories.get(categoryId);
    if (category === undefined || category.organizationId !== organizationId) {
      return null;
    }
    return category;
  }

  async findCategoryByCode(
    organizationId: string,
    code: string
  ): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.organizationId === organizationId && category.code === code) {
        return category;
      }
    }
    return null;
  }

  async listCategories(organizationId: string): Promise<Category[]> {
    return [...this.categories.values()]
      .filter((category) => category.organizationId === organizationId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async insertCategory(category: Category): Promise<Category> {
    this.categories.set(category.id, { ...category });
    return category;
  }

  async updateCategory(category: Category): Promise<Category> {
    this.categories.set(category.id, { ...category });
    return category;
  }
}

export class DemoBrandRepository implements BrandRepository {
  brands = new Map<string, Brand>();

  async findBrandById(
    organizationId: string,
    brandId: string
  ): Promise<Brand | null> {
    const brand = this.brands.get(brandId);
    if (brand === undefined || brand.organizationId !== organizationId) {
      return null;
    }
    return brand;
  }

  async findBrandByCode(
    organizationId: string,
    code: string
  ): Promise<Brand | null> {
    for (const brand of this.brands.values()) {
      if (brand.organizationId === organizationId && brand.code === code) {
        return brand;
      }
    }
    return null;
  }

  async listBrands(organizationId: string): Promise<Brand[]> {
    return [...this.brands.values()]
      .filter((brand) => brand.organizationId === organizationId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async insertBrand(brand: Brand): Promise<Brand> {
    this.brands.set(brand.id, { ...brand });
    return brand;
  }

  async updateBrand(brand: Brand): Promise<Brand> {
    this.brands.set(brand.id, { ...brand });
    return brand;
  }
}

export class DemoProductLineRepository implements ProductLineRepository {
  lines = new Map<string, ProductLine>();

  async findProductLineById(
    organizationId: string,
    lineId: string
  ): Promise<ProductLine | null> {
    const line = this.lines.get(lineId);
    if (line === undefined || line.organizationId !== organizationId) {
      return null;
    }
    return line;
  }

  async findProductLineByExternalId(
    organizationId: string,
    externalId: string
  ): Promise<ProductLine | null> {
    for (const line of this.lines.values()) {
      if (
        line.organizationId === organizationId &&
        line.externalId === externalId
      ) {
        return line;
      }
    }
    return null;
  }

  async listProductLines(organizationId: string): Promise<ProductLine[]> {
    return [...this.lines.values()]
      .filter((line) => line.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async insertProductLine(line: ProductLine): Promise<ProductLine> {
    this.lines.set(line.id, { ...line });
    return line;
  }

  async updateProductLine(line: ProductLine): Promise<ProductLine> {
    this.lines.set(line.id, { ...line });
    return line;
  }
}

export class DemoUnitRepository implements UnitRepository {
  units = new Map<string, Unit>();

  async findUnitById(
    organizationId: string,
    unitId: string
  ): Promise<Unit | null> {
    const unit = this.units.get(unitId);
    if (unit === undefined || unit.organizationId !== organizationId) {
      return null;
    }
    return unit;
  }

  async findUnitByCode(
    organizationId: string,
    code: string
  ): Promise<Unit | null> {
    for (const unit of this.units.values()) {
      if (unit.organizationId === organizationId && unit.code === code) {
        return unit;
      }
    }
    return null;
  }

  async listUnits(organizationId: string): Promise<Unit[]> {
    return [...this.units.values()]
      .filter((unit) => unit.organizationId === organizationId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async insertUnit(unit: Unit): Promise<Unit> {
    this.units.set(unit.id, { ...unit });
    return unit;
  }

  async updateUnit(unit: Unit): Promise<Unit> {
    this.units.set(unit.id, { ...unit });
    return unit;
  }
}

export function assertDemoNotNull<T>(value: T | null, context: string): T {
  if (value === null) {
    throw new CatalogDataError(`Demo repository invariant violated in ${context}`);
  }
  return value;
}
