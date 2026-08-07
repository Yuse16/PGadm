import type { CatalogContext } from "@/features/catalog/application";
import { createCatalogActor } from "@/features/catalog/domain";
import type {
  Barcode,
  Brand,
  CatalogActor,
  Category,
  Product,
  ProductLine,
  Unit,
  Variant,
} from "@/features/catalog/domain";
import {
  DemoBrandRepository,
  DemoCategoryRepository,
  DemoProductLineRepository,
  DemoProductRepository,
  DemoUnitRepository,
  NoopCatalogAuditRepository,
  NoopCatalogIntegrationRepository,
} from "@/features/catalog/infrastructure";

export const ORG_A = "10000000-0000-0000-0000-000000000001";
export const ORG_B = "20000000-0000-0000-0000-000000000001";
export const USER_A = "30000000-0000-0000-0000-000000000001";

export function actor(
  permissions: string[] = [],
  organizationId: string = ORG_A
): CatalogActor {
  return createCatalogActor({
    userId: USER_A,
    organizationId,
    permissions,
  });
}

export const READ_WRITER = [
  "catalog.read",
  "catalog.create",
  "catalog.update",
  "catalog.archive",
  "catalog.manage",
];

export function unit(id: string, overrides: Partial<Unit> = {}): Unit {
  return {
    id,
    organizationId: ORG_A,
    code: "PZA",
    name: "Pieza",
    kind: "count",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function brand(id: string, overrides: Partial<Brand> = {}): Brand {
  return {
    id,
    organizationId: ORG_A,
    code: "TUB",
    name: "Tubería",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function line(id: string, overrides: Partial<ProductLine> = {}): ProductLine {
  return {
    id,
    organizationId: ORG_A,
    externalId: null,
    name: "Línea de tubería",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function category(
  id: string,
  overrides: Partial<Category> = {}
): Category {
  return {
    id,
    organizationId: ORG_A,
    parentId: null,
    code: "TUB",
    name: "Tubería",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function product(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    organizationId: ORG_A,
    externalId: null,
    description: "Tubo de PVC de 100mm",
    shortName: null,
    brandId: null,
    categoryId: null,
    lineId: null,
    technicalDescription: null,
    status: "inactive",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function variant(id: string, overrides: Partial<Variant> = {}): Variant {
  return {
    id,
    organizationId: ORG_A,
    productId: "product-1",
    sku: "TUB-PVC-100",
    displayName: null,
    format: null,
    finish: null,
    baseUnitId: "unit-1",
    saleUnitId: "unit-1",
    baseUnitsPerSaleUnit: 1,
    piecesPerBox: null,
    squareMetersPerBox: null,
    referencePrice: null,
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function barcode(id: string, overrides: Partial<Barcode> = {}): Barcode {
  return {
    id,
    organizationId: ORG_A,
    variantId: "variant-1",
    barcode: "7501000000001",
    isPrimary: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export interface TestContextOptions {
  products?: Product[];
  variants?: Variant[];
  barcodes?: Barcode[];
  categories?: Category[];
  brands?: Brand[];
  lines?: ProductLine[];
  units?: Unit[];
}

export function makeContext(
  options: TestContextOptions = {}
): CatalogContext & { auditRepository: NoopCatalogAuditRepository } {
  const productRepository = new DemoProductRepository();
  const categoryRepository = new DemoCategoryRepository();
  const brandRepository = new DemoBrandRepository();
  const productLineRepository = new DemoProductLineRepository();
  const unitRepository = new DemoUnitRepository();
  const auditRepository = new NoopCatalogAuditRepository();

  for (const item of options.products ?? []) {
    productRepository.products.set(item.id, item);
  }
  for (const item of options.variants ?? []) {
    productRepository.variants.set(item.id, item);
  }
  for (const item of options.barcodes ?? []) {
    productRepository.barcodes.set(item.id, item);
  }
  for (const item of options.categories ?? []) {
    categoryRepository.categories.set(item.id, item);
  }
  for (const item of options.brands ?? []) {
    brandRepository.brands.set(item.id, item);
  }
  for (const item of options.lines ?? []) {
    productLineRepository.lines.set(item.id, item);
  }
  for (const item of options.units ?? []) {
    unitRepository.units.set(item.id, item);
  }

  return {
    productRepository,
    categoryRepository,
    brandRepository,
    productLineRepository,
    unitRepository,
    auditRepository,
    integrationRepository: new NoopCatalogIntegrationRepository(),
  };
}

export function standardReferences(): TestContextOptions {
  return {
    units: [
      unit("unit-1"),
      unit("unit-2", { id: "unit-2", code: "CAJA", name: "Caja", kind: "package" }),
    ],
    brands: [brand("brand-1"), brand("brand-2", { id: "brand-2", code: "VAL" })],
    lines: [line("line-1")],
    categories: [category("category-1")],
  };
}
