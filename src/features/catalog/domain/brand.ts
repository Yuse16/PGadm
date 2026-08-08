import type { ReferenceStatus } from "./status";

export interface Brand {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDraft {
  code: string;
  name: string;
}
