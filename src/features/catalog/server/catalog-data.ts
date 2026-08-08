import type { CatalogContext } from "@/features/catalog/application";
import type {
  Barcode,
  Category,
  Product,
  ProductStatus,
  Variant,
} from "@/features/catalog/domain";

export interface ProductTableRow {
  product: Product;
  brandName: string | null;
  categoryName: string | null;
  lineName: string | null;
  variantCount: number;
}

export interface CatalogStats {
  products: number;
  variants: number;
  categories: number;
  brands: number;
  lines: number;
  units: number;
  activeProducts: number;
  archivedProducts: number;
}

export interface VariantTableRow {
  productId: string;
  productDescription: string;
  productStatus: ProductStatus;
  variant: Variant;
  primaryBarcode: Barcode | null;
  secondaryBarcodes: Barcode[];
  baseUnitName: string | null;
  saleUnitName: string | null;
}

function mapById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/** Builds the brand/category/line/variant-count columns for a products table. */
export async function buildProductTableRows(
  context: CatalogContext,
  organizationId: string,
  products: readonly Product[]
): Promise<ProductTableRow[]> {
  const [brands, categories, lines, variants] = await Promise.all([
    context.brandRepository.listBrands(organizationId),
    context.categoryRepository.listCategories(organizationId),
    context.productLineRepository.listProductLines(organizationId),
    Promise.all(
      products.map((product) =>
        context.productRepository.listVariantsByProduct(organizationId, product.id)
      )
    ),
  ]);

  const brandMap = mapById(brands);
  const categoryMap = mapById(categories);
  const lineMap = mapById(lines);

  return products.map((product, index) => ({
    product,
    brandName: product.brandId === null ? null : brandMap.get(product.brandId)?.name ?? null,
    categoryName:
      product.categoryId === null ? null : categoryMap.get(product.categoryId)?.name ?? null,
    lineName: product.lineId === null ? null : lineMap.get(product.lineId)?.name ?? null,
    variantCount: variants[index]?.length ?? 0,
  }));
}

export async function getCatalogStats(
  context: CatalogContext,
  organizationId: string
): Promise<CatalogStats> {
  const [products, categories, brands, lines, units] = await Promise.all([
    context.productRepository.listProducts(organizationId),
    context.categoryRepository.listCategories(organizationId),
    context.brandRepository.listBrands(organizationId),
    context.productLineRepository.listProductLines(organizationId),
    context.unitRepository.listUnits(organizationId),
  ]);

  const variantCounts = await Promise.all(
    products.map((product) =>
      context.productRepository.listVariantsByProduct(organizationId, product.id)
    )
  );
  const variants = variantCounts.reduce((total, list) => total + list.length, 0);

  return {
    products: products.length,
    variants,
    categories: categories.length,
    brands: brands.length,
    lines: lines.length,
    units: units.length,
    activeProducts: products.filter((product) => product.status === "active").length,
    archivedProducts: products.filter((product) => product.status === "discontinued").length,
  };
}

export interface CategoryOption {
  id: string;
  code: string;
  name: string;
  depth: number;
}

/** Flattens a category tree into an indented option list for selects. */
export function flattenCategoriesWithDepth(categories: readonly Category[]): CategoryOption[] {
  const children = new Map<string, Category[]>();
  for (const category of categories) {
    if (category.parentId !== null) {
      const siblings = children.get(category.parentId) ?? [];
      siblings.push(category);
      children.set(category.parentId, siblings);
    }
  }
  const byId = new Map(categories.map((category) => [category.id, category]));

  const options: CategoryOption[] = [];
  const roots = categories.filter(
    (category) => category.parentId === null || !byId.has(category.parentId)
  );

  function visit(category: Category, depth: number) {
    options.push({ id: category.id, code: category.code, name: category.name, depth });
    for (const child of children.get(category.id) ?? []) {
      visit(child, depth + 1);
    }
  }

  for (const root of roots) {
    visit(root, 0);
  }
  return options;
}

export function sortByUpdatedAtDesc(products: readonly Product[]): Product[] {
  return [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getVariantTableRows(
  context: CatalogContext,
  organizationId: string
): Promise<VariantTableRow[]> {
  const [products, units] = await Promise.all([
    context.productRepository.listProducts(organizationId),
    context.unitRepository.listUnits(organizationId),
  ]);
  const unitMap = mapById(units);

  const rows: VariantTableRow[] = [];
  for (const product of products) {
    const variants = await context.productRepository.listVariantsByProduct(
      organizationId,
      product.id
    );
    for (const variant of variants) {
      const barcodes = await context.productRepository.listBarcodesByVariant(
        organizationId,
        variant.id
      );
      rows.push({
        productId: product.id,
        productDescription: product.description,
        productStatus: product.status,
        variant,
        primaryBarcode: barcodes.find((barcode) => barcode.isPrimary) ?? null,
        secondaryBarcodes: barcodes.filter((barcode) => !barcode.isPrimary),
        baseUnitName: unitMap.get(variant.baseUnitId)?.name ?? null,
        saleUnitName: unitMap.get(variant.saleUnitId)?.name ?? null,
      });
    }
  }
  return rows;
}
