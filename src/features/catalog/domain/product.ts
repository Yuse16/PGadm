import type { ProductStatus } from "./status";

export interface Product {
  id: string;
  organizationId: string;
  externalId: string | null;
  description: string;
  shortName: string | null;
  brandId: string | null;
  categoryId: string | null;
  lineId: string | null;
  technicalDescription: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable product fields (DTO for CreateProduct/UpdateProduct). Status is
 * managed by the lifecycle use cases, never set directly here.
 */
export interface ProductDraft {
  externalId: string | null;
  description: string;
  shortName: string | null;
  brandId: string | null;
  categoryId: string | null;
  lineId: string | null;
  technicalDescription: string | null;
}

export interface ProductListOptions {
  status?: ProductStatus;
}
