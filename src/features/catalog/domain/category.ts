import type { ReferenceStatus } from "./status";

export interface Category {
  id: string;
  organizationId: string;
  parentId: string | null;
  code: string;
  name: string;
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable category fields (DTO). Tree integrity (max 3 levels, no cycles,
 * no self-parent) is validated by the use cases against the repository and
 * again by the `_catalog.enforce_category_tree` trigger in the database.
 */
export interface CategoryDraft {
  parentId: string | null;
  code: string;
  name: string;
}

export const CATEGORY_MAX_DEPTH = 3;
