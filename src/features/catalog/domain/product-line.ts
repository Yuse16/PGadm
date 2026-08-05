import type { ReferenceStatus } from "./status";

export interface ProductLine {
  id: string;
  organizationId: string;
  externalId: string | null;
  name: string;
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLineDraft {
  externalId: string | null;
  name: string;
}
