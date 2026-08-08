/**
 * Server-derived permission flags passed to client components. Authorization is
 * decided server-side by the existing catalog guards (`requireCatalog*`); the
 * UI only reflects those decisions to show/hide actions (Fase 1C.4 §12).
 * The server actions re-guard on every mutation, so a hidden button can never
 * be bypassed from the client.
 */
export interface CatalogPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canArchive: boolean;
  canManage: boolean;
}

export function readOnlyPermissions(): CatalogPermissions {
  return {
    canCreate: false,
    canUpdate: false,
    canArchive: false,
    canManage: false,
  };
}
