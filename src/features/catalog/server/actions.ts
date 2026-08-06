"use server";

import type { CatalogContext } from "@/features/catalog/application";
import {
  actorFromIdentitySession,
  addBarcode,
  archiveCategory,
  archiveProduct,
  archiveVariant,
  changePrimaryBarcode,
  createBrand,
  createCategory,
  createProduct,
  createProductLine,
  createUnit,
  createVariant,
  getProduct,
  requireCatalogArchive,
  requireCatalogCreate,
  requireCatalogManage,
  requireCatalogUpdate,
  restoreProduct,
  restoreVariant,
  updateBrand,
  updateCategory,
  updateProduct,
  updateProductLine,
  updateUnit,
  updateVariant,
} from "@/features/catalog/application";
import type {
  BrandChanges,
  CategoryChanges,
  CreateBrandInput,
  CreateCategoryInput,
  CreateProductLineInput,
  CreateUnitInput,
  CreateVariantInput,
  ProductLineChanges,
  UnitChanges,
  UpdateBrandInput,
} from "@/features/catalog/application";
import type { CatalogActor } from "@/features/catalog/domain";
import {
  CatalogError,
  CatalogPermissionError,
  RepositoryConfigurationError,
} from "@/features/catalog/domain";
import type {
  Barcode,
  Brand,
  Category,
  Product,
  ProductDraft,
  ProductLine,
  Unit,
  Variant,
  VariantDraft,
} from "@/features/catalog/domain";
import type { IdentitySession } from "@/features/identity/domain";
import type { ActionResult } from "@/features/catalog/components/action-results";
import { getCatalogContext } from "./context";

type Mutation<T> = (
  context: CatalogContext,
  actor: CatalogActor,
  organizationId: string
) => Promise<T>;

/**
 * Wraps every server action: guards first (authorization is decided server-side,
 * never from client payloads), then runs the mutation inside the actor's own
 * organization. Catalog/identity errors become `{ ok: false }` results so the
 * UI can render them as toasts; Next navigation redirects (login/forbidden)
 * are re-thrown untouched.
 */
async function runMutation<T>(
  guard: () => Promise<IdentitySession>,
  mutate: Mutation<T>
): Promise<ActionResult<T>> {
  try {
    const session = await guard();
    const actor = actorFromIdentitySession(session);
    const organizationId = session.organizationId;
    if (organizationId === null) {
      throw new CatalogPermissionError("catalog.read");
    }
    const context = await getCatalogContext();
    const entity = await mutate(context, actor, organizationId);
    return { ok: true, entity };
  } catch (error) {
    if (isNextNavigation(error)) {
      throw error;
    }
    return { ok: false, error: toUserMessage(error) };
  }
}

function isNextNavigation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

function toUserMessage(error: unknown): string {
  if (error instanceof RepositoryConfigurationError) {
    return "La base de datos no está configurada. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  if (error instanceof CatalogPermissionError) {
    return "No tienes permisos para realizar esta operación.";
  }
  if (error instanceof CatalogError) {
    return error.message;
  }
  if (error instanceof Error && error.message !== "") {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}

/* ------------------------------------------------------------------ */
/* Products                                                           */
/* ------------------------------------------------------------------ */

export async function createProductAction(
  draft: ProductDraft
): Promise<ActionResult<Product>> {
  return runMutation(requireCatalogCreate, (context, actor, organizationId) =>
    createProduct(context, { actor, organizationId, product: draft })
  );
}

export async function updateProductAction(
  productId: string,
  draft: ProductDraft,
  status?: "active" | "inactive"
): Promise<ActionResult<Product>> {
  return runMutation(requireCatalogUpdate, (context, actor, organizationId) =>
    updateProduct(context, { actor, organizationId, productId, product: draft, status })
  );
}

export async function archiveProductAction(
  productId: string
): Promise<ActionResult<Product>> {
  return runMutation(requireCatalogArchive, (context, actor, organizationId) =>
    archiveProduct(context, { actor, organizationId, productId })
  );
}

export async function restoreProductAction(
  productId: string
): Promise<ActionResult<Product>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    restoreProduct(context, { actor, organizationId, productId, status: "inactive" })
  );
}

/**
 * Duplicate copies the product fields into a new product (no variants: SKUs are
 * org-unique and the copy starts as `inactive`). External id is cleared because
 * it is org-unique as well.
 */
export async function duplicateProductAction(
  productId: string
): Promise<ActionResult<Product>> {
  return runMutation(requireCatalogCreate, async (context, actor, organizationId) => {
    const source = await getProduct(context, { actor, organizationId, productId });
    return createProduct(context, {
      actor,
      organizationId,
      product: {
        externalId: null,
        description: `${source.product.description} (copia)`,
        shortName: source.product.shortName,
        brandId: source.product.brandId,
        categoryId: source.product.categoryId,
        lineId: source.product.lineId,
        technicalDescription: source.product.technicalDescription,
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Variants                                                           */
/* ------------------------------------------------------------------ */

export async function createVariantAction(
  productId: string,
  variant: VariantDraft
): Promise<ActionResult<Variant>> {
  return runMutation(requireCatalogCreate, (context, actor, organizationId) =>
    createVariant(context, { actor, organizationId, productId, variant } satisfies CreateVariantInput)
  );
}

export async function updateVariantAction(
  productId: string,
  variantId: string,
  variant: VariantDraft,
  status: "active" | "inactive"
): Promise<ActionResult<Variant>> {
  return runMutation(requireCatalogUpdate, (context, actor, organizationId) =>
    updateVariant(context, { actor, organizationId, productId, variantId, variant, status })
  );
}

export async function archiveVariantAction(
  productId: string,
  variantId: string
): Promise<ActionResult<Variant>> {
  return runMutation(requireCatalogArchive, (context, actor, organizationId) =>
    archiveVariant(context, { actor, organizationId, productId, variantId })
  );
}

export async function restoreVariantAction(
  productId: string,
  variantId: string
): Promise<ActionResult<Variant>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    restoreVariant(context, { actor, organizationId, productId, variantId, status: "active" })
  );
}

/* ------------------------------------------------------------------ */
/* Barcodes                                                           */
/* ------------------------------------------------------------------ */

export async function addBarcodeAction(
  variantId: string,
  barcode: string,
  isPrimary: boolean
): Promise<ActionResult<Barcode>> {
  return runMutation(requireCatalogCreate, (context, actor, organizationId) =>
    addBarcode(context, { actor, organizationId, variantId, barcode, isPrimary })
  );
}

export async function changePrimaryBarcodeAction(
  variantId: string,
  barcodeId: string
): Promise<ActionResult<Barcode>> {
  return runMutation(requireCatalogUpdate, (context, actor, organizationId) =>
    changePrimaryBarcode(context, { actor, organizationId, variantId, barcodeId })
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                         */
/* ------------------------------------------------------------------ */

export async function createCategoryAction(
  draft: CreateCategoryInput["category"]
): Promise<ActionResult<Category>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    createCategory(context, { actor, organizationId, category: draft })
  );
}

export async function updateCategoryAction(
  categoryId: string,
  changes: CategoryChanges
): Promise<ActionResult<Category>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    updateCategory(context, { actor, organizationId, categoryId, changes })
  );
}

export async function archiveCategoryAction(
  categoryId: string
): Promise<ActionResult<Category>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    archiveCategory(context, { actor, organizationId, categoryId })
  );
}

/* ------------------------------------------------------------------ */
/* Brands                                                             */
/* ------------------------------------------------------------------ */

export async function createBrandAction(
  draft: CreateBrandInput["brand"]
): Promise<ActionResult<Brand>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    createBrand(context, { actor, organizationId, brand: draft })
  );
}

export async function updateBrandAction(
  brandId: string,
  changes: BrandChanges
): Promise<ActionResult<Brand>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    updateBrand(context, { actor, organizationId, brandId, changes } satisfies UpdateBrandInput)
  );
}

/* ------------------------------------------------------------------ */
/* Product lines                                                      */
/* ------------------------------------------------------------------ */

export async function createProductLineAction(
  draft: CreateProductLineInput["productLine"]
): Promise<ActionResult<ProductLine>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    createProductLine(context, { actor, organizationId, productLine: draft })
  );
}

export async function updateProductLineAction(
  lineId: string,
  changes: ProductLineChanges
): Promise<ActionResult<ProductLine>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    updateProductLine(context, { actor, organizationId, lineId, changes })
  );
}

/* ------------------------------------------------------------------ */
/* Units                                                              */
/* ------------------------------------------------------------------ */

export async function createUnitAction(
  draft: CreateUnitInput["unit"]
): Promise<ActionResult<Unit>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    createUnit(context, { actor, organizationId, unit: draft })
  );
}

export async function updateUnitAction(
  unitId: string,
  changes: UnitChanges
): Promise<ActionResult<Unit>> {
  return runMutation(requireCatalogManage, (context, actor, organizationId) =>
    updateUnit(context, { actor, organizationId, unitId, changes })
  );
}
