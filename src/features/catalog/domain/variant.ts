import type { ProductStatus } from "./status";

export interface Variant {
  id: string;
  organizationId: string;
  productId: string;
  sku: string;
  displayName: string | null;
  format: string | null;
  finish: string | null;
  baseUnitId: string;
  saleUnitId: string;
  baseUnitsPerSaleUnit: number;
  piecesPerBox: number | null;
  squareMetersPerBox: number | null;
  referencePrice: number | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable variant fields (DTO for CreateVariant/UpdateVariant). Status is
 * managed by the lifecycle use cases.
 */
export interface VariantDraft {
  sku: string;
  displayName: string | null;
  format: string | null;
  finish: string | null;
  baseUnitId: string;
  saleUnitId: string;
  baseUnitsPerSaleUnit: number;
  piecesPerBox: number | null;
  squareMetersPerBox: number | null;
  referencePrice: number | null;
}
