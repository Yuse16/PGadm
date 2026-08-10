import { LayoutNotFoundError } from "./layout-errors";
import type {
  Layout,
  LayoutElement,
  LayoutPosition,
  LayoutVersionEntry,
} from "./entities";

export interface LayoutListOptions {
  branchId?: string;
  /** Include archived layouts (LA-14: archived stays out of the active query). */
  includeArchived?: boolean;
}

export interface PositionListOptions {
  elementId?: string;
  reviewStatus?: string;
}

/**
 * Layout aggregate repository (layouts + elements + positions + version
 * history). All methods are org-scoped: callers must pass the organization
 * that owns the data; a mismatch is a not-found, never a cross-org read
 * (D-C07). In-memory demo and Supabase (RLS-scoped) implementations share this
 * contract; the DB re-checks org scoping via composite FKs + RLS. Position
 * history is append-only (LA-28): no update/delete methods are exposed for it.
 */
export interface LayoutRepository {
  // ---- layouts -----------------------------------------------------------
  listLayouts(organizationId: string, options?: LayoutListOptions): Promise<Layout[]>;
  findLayoutById(organizationId: string, layoutId: string): Promise<Layout | null>;
  findLayoutByBranchAndName(
    organizationId: string,
    branchId: string,
    name: string
  ): Promise<Layout | null>;
  insertLayout(layout: Layout): Promise<Layout>;
  updateLayout(layout: Layout): Promise<Layout>;

  // ---- elements ----------------------------------------------------------
  listElements(organizationId: string, layoutId: string): Promise<LayoutElement[]>;
  findElementById(organizationId: string, elementId: string): Promise<LayoutElement | null>;
  findElementByCode(
    organizationId: string,
    layoutId: string,
    code: string
  ): Promise<LayoutElement | null>;
  insertElement(element: LayoutElement): Promise<LayoutElement>;
  updateElement(element: LayoutElement): Promise<LayoutElement>;

  // ---- positions ---------------------------------------------------------
  listPositions(organizationId: string, options?: PositionListOptions): Promise<LayoutPosition[]>;
  findPositionById(organizationId: string, positionId: string): Promise<LayoutPosition | null>;
  findPositionByCode(
    organizationId: string,
    elementId: string,
    positionCode: string
  ): Promise<LayoutPosition | null>;
  insertPosition(position: LayoutPosition): Promise<LayoutPosition>;
  updatePosition(position: LayoutPosition): Promise<LayoutPosition>;

  // ---- version history (append-only) -------------------------------------
  listVersionHistory(organizationId: string, layoutId: string): Promise<LayoutVersionEntry[]>;
  insertVersionEntry(entry: LayoutVersionEntry): Promise<LayoutVersionEntry>;
}

export function requireLayoutEntity<T>(
  value: T | null,
  entity: string,
  id: string
): T {
  if (value === null) {
    throw new LayoutNotFoundError(entity, id);
  }
  return value;
}
