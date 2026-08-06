export { getCatalogContext } from "./context";
export { permissionsFromSession, requireCatalogSession } from "./session";
export type { CatalogSessionAccess } from "./session";
export {
  buildProductTableRows,
  flattenCategoriesWithDepth,
  getCatalogStats,
  getVariantTableRows,
  sortByUpdatedAtDesc,
} from "./catalog-data";
export type {
  CatalogStats,
  CategoryOption,
  ProductTableRow,
  VariantTableRow,
} from "./catalog-data";
export { getProductHistory } from "./history";
export type { ProductHistoryEntry } from "./history";
