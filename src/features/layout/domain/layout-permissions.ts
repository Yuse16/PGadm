/**
 * Layout permission codes (D-L10, F3_RLS_PERMISSION_MATRIX).
 *
 * These match the `layout.*` rows seeded in 3.2
 * (`50000000-0000-0000-0000-000000000016..019`):
 *   - layout.read     -> SELECT layout tables + layout audit events
 *   - layout.edit     -> edit draft layouts: add/move/rotate/resize/lock/hide/
 *                        duplicate elements and assign products
 *   - layout.publish  -> publish layout versions (draft -> published) and
 *                        restore versions
 *   - layout.manage   -> manage layouts: create/archive/rename, soft-retire
 *                        drafts and reassign store
 */
export const LAYOUT_READ = "layout.read" as const;
export const LAYOUT_EDIT = "layout.edit" as const;
export const LAYOUT_PUBLISH = "layout.publish" as const;
export const LAYOUT_MANAGE = "layout.manage" as const;

export const LAYOUT_PERMISSIONS = [
  LAYOUT_READ,
  LAYOUT_EDIT,
  LAYOUT_PUBLISH,
  LAYOUT_MANAGE,
] as const;

export type LayoutPermission = (typeof LAYOUT_PERMISSIONS)[number];

export function isLayoutPermission(value: string): value is LayoutPermission {
  return (LAYOUT_PERMISSIONS as readonly string[]).includes(value);
}
