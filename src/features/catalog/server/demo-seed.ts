import type { CatalogContext } from "@/features/catalog/application";
import type {
  Barcode,
  Brand,
  Category,
  Product,
  ProductLine,
  Unit,
  Variant,
} from "@/features/catalog/domain";

/**
 * Demo fixtures for the catalog UI (CATALOG_DATA_SOURCE=demo).
 *
 * The demo repositories are in-memory Maps created per `createCatalogContext()`
 * call, so without this seed the UI would render empty every request. This
 * module mirrors the PGM fixtures that `supabase/seed.sql` inserts for the
 * `10000000-...-000000000001` organization, pushed through the repository
 * insert API only — the repositories/use cases are not modified (Fase 1C.4
 * constraint). Data lives in a module-level singleton context, so it persists
 * for the lifetime of the dev server process.
 */
const ORG_ID = "10000000-0000-0000-0000-000000000001";
const TS = "2026-08-05T00:00:00.000Z";

const UNITS: Unit[] = [
  {
    id: "70000000-0000-0000-0000-000000000001",
    organizationId: ORG_ID,
    code: "PZA",
    name: "Pieza",
    kind: "count",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000002",
    organizationId: ORG_ID,
    code: "M",
    name: "Metro",
    kind: "length",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000003",
    organizationId: ORG_ID,
    code: "M2",
    name: "Metro cuadrado",
    kind: "area",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000004",
    organizationId: ORG_ID,
    code: "L",
    name: "Litro",
    kind: "volume",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000005",
    organizationId: ORG_ID,
    code: "KG",
    name: "Kilogramo",
    kind: "mass",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000006",
    organizationId: ORG_ID,
    code: "CAJA",
    name: "Caja",
    kind: "package",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
];

const LINES: ProductLine[] = [
  {
    id: "70000000-0000-0000-0000-000000000011",
    organizationId: ORG_ID,
    externalId: "TUB",
    name: "Tubería y conexiones",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000012",
    organizationId: ORG_ID,
    externalId: "VAL",
    name: "Válvulas y llaves",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000013",
    organizationId: ORG_ID,
    externalId: "HER",
    name: "Herramientas",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
];

const BRANDS: Brand[] = [
  {
    id: "70000000-0000-0000-0000-000000000021",
    organizationId: ORG_ID,
    code: "MD-A",
    name: "Marca Demo A",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000022",
    organizationId: ORG_ID,
    code: "MD-B",
    name: "Marca Demo B",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
];

const CATEGORIES: Category[] = [
  {
    id: "70000000-0000-0000-0000-000000000031",
    organizationId: ORG_ID,
    parentId: null,
    code: "TUBERIA",
    name: "Tubería",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000032",
    organizationId: ORG_ID,
    parentId: "70000000-0000-0000-0000-000000000031",
    code: "TUB-PVC",
    name: "Tubería PVC",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000033",
    organizationId: ORG_ID,
    parentId: "70000000-0000-0000-0000-000000000032",
    code: "TUB-PVC-PRES",
    name: "Tubería PVC de presión",
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
];

const PRODUCTS: Product[] = [
  {
    id: "70000000-0000-0000-0000-000000000041",
    organizationId: ORG_ID,
    externalId: "TUB-PVC-100",
    description: "Tubo de PVC hidráulico de 1 pulgada, Cédula 40",
    shortName: "Tubo PVC 1\" CED 40",
    brandId: "70000000-0000-0000-0000-000000000021",
    categoryId: "70000000-0000-0000-0000-000000000032",
    lineId: "70000000-0000-0000-0000-000000000011",
    technicalDescription: null,
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000042",
    organizationId: ORG_ID,
    externalId: "VAL-GLOBO-050",
    description: "Válvula de globo de bronce de 1/2 pulgada",
    shortName: "Válvula globo 1/2\" bronce",
    brandId: "70000000-0000-0000-0000-000000000022",
    categoryId: null,
    lineId: "70000000-0000-0000-0000-000000000012",
    technicalDescription: null,
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000043",
    organizationId: ORG_ID,
    externalId: "VAL-COMPUERTA-100",
    description: "Válvula de compuerta de bronce de 1 pulgada",
    shortName: "Válvula compuerta 1\" bronce",
    brandId: "70000000-0000-0000-0000-000000000022",
    categoryId: null,
    lineId: "70000000-0000-0000-0000-000000000012",
    technicalDescription: null,
    status: "inactive",
    createdAt: TS,
    updatedAt: TS,
  },
];

const VARIANTS: Variant[] = [
  {
    id: "70000000-0000-0000-0000-000000000051",
    organizationId: ORG_ID,
    productId: "70000000-0000-0000-0000-000000000041",
    sku: "TUB-PVC-100-PZA",
    displayName: "Tubo PVC 1\" CED 40 por pieza",
    format: null,
    finish: null,
    baseUnitId: "70000000-0000-0000-0000-000000000001",
    saleUnitId: "70000000-0000-0000-0000-000000000001",
    baseUnitsPerSaleUnit: 1,
    piecesPerBox: null,
    squareMetersPerBox: null,
    referencePrice: 42.5,
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000052",
    organizationId: ORG_ID,
    productId: "70000000-0000-0000-0000-000000000041",
    sku: "TUB-PVC-100-CJA",
    displayName: "Caja con 25 tubos PVC 1\" CED 40",
    format: null,
    finish: null,
    baseUnitId: "70000000-0000-0000-0000-000000000001",
    saleUnitId: "70000000-0000-0000-0000-000000000006",
    baseUnitsPerSaleUnit: 25,
    piecesPerBox: 25,
    squareMetersPerBox: null,
    referencePrice: 1000,
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000053",
    organizationId: ORG_ID,
    productId: "70000000-0000-0000-0000-000000000042",
    sku: "VAL-GLOBO-050-PZA",
    displayName: "Válvula globo 1/2\" bronce",
    format: null,
    finish: null,
    baseUnitId: "70000000-0000-0000-0000-000000000001",
    saleUnitId: "70000000-0000-0000-0000-000000000001",
    baseUnitsPerSaleUnit: 1,
    piecesPerBox: null,
    squareMetersPerBox: null,
    referencePrice: 185.5,
    status: "active",
    createdAt: TS,
    updatedAt: TS,
  },
];

const BARCODES: Barcode[] = [
  {
    id: "70000000-0000-0000-0000-000000000061",
    organizationId: ORG_ID,
    variantId: "70000000-0000-0000-0000-000000000051",
    barcode: "7500000000017",
    isPrimary: true,
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000062",
    organizationId: ORG_ID,
    variantId: "70000000-0000-0000-0000-000000000051",
    barcode: "7500000000024",
    isPrimary: false,
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000063",
    organizationId: ORG_ID,
    variantId: "70000000-0000-0000-0000-000000000052",
    barcode: "7500000000031",
    isPrimary: true,
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "70000000-0000-0000-0000-000000000064",
    organizationId: ORG_ID,
    variantId: "70000000-0000-0000-0000-000000000053",
    barcode: "7500000000048",
    isPrimary: true,
    createdAt: TS,
    updatedAt: TS,
  },
];

/**
 * Idempotent: the demo Maps key by id, so re-running after a hot reload only
 * overwrites the same rows.
 */
export async function seedDemoCatalog(context: CatalogContext): Promise<void> {
  for (const unit of UNITS) {
    await context.unitRepository.insertUnit(unit);
  }
  for (const line of LINES) {
    await context.productLineRepository.insertProductLine(line);
  }
  for (const brand of BRANDS) {
    await context.brandRepository.insertBrand(brand);
  }
  for (const category of CATEGORIES) {
    await context.categoryRepository.insertCategory(category);
  }
  for (const product of PRODUCTS) {
    await context.productRepository.insertProduct(product);
  }
  for (const variant of VARIANTS) {
    await context.productRepository.insertVariant(variant);
  }
  for (const barcode of BARCODES) {
    await context.productRepository.insertBarcode(barcode);
  }
}
