/**
 * Catalog permission codes (D-C10, F1C_RLS_PERMISSION_MATRIX).
 *
 * These match the `catalog.*` rows seeded in 1C.2
 * (`50000000-0000-0000-0000-000000000007..011`). The phase brief refers to
 * "catalog.write" and "catalog.admin"; the database uses four explicit codes
 * and this module is the single mapping:
 *   - catalog.write  -> create (INSERT) + update (edit/transitions)
 *   - catalog.admin  -> manage (structure + restore)
 */
export const CATALOG_READ = "catalog.read" as const;
export const CATALOG_CREATE = "catalog.create" as const;
export const CATALOG_UPDATE = "catalog.update" as const;
export const CATALOG_ARCHIVE = "catalog.archive" as const;
export const CATALOG_MANAGE = "catalog.manage" as const;

export const CATALOG_PERMISSIONS = [
  CATALOG_READ,
  CATALOG_CREATE,
  CATALOG_UPDATE,
  CATALOG_ARCHIVE,
  CATALOG_MANAGE,
] as const;

export type CatalogPermission = (typeof CATALOG_PERMISSIONS)[number];

export function isCatalogPermission(value: string): value is CatalogPermission {
  return (CATALOG_PERMISSIONS as readonly string[]).includes(value);
}
