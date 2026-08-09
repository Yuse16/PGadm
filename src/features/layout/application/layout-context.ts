import type {
  LayoutAuditRepository,
  LayoutReferenceCatalog,
  LayoutRepository,
  LayoutStockProvider,
} from "../domain";

/**
 * Shared dependency container for layout use cases. Injected (never imported
 * globally) so tests can pass in-memory fakes; the production wiring lives in
 * `infrastructure/index.ts` and is selected deterministically by
 * `LAYOUT_DATA_SOURCE` (D-L11, D031: no silent fallback after a failed read).
 */
export interface LayoutContext {
  layoutRepository: LayoutRepository;
  auditRepository: LayoutAuditRepository;
  referenceCatalog: LayoutReferenceCatalog;
  stockProvider: LayoutStockProvider;
}
