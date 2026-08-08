/**
 * Shared result envelope for catalog server actions. Server actions cannot
 * return thrown errors to the client (they become generic 500s), so every
 * action maps Catalog* errors into a `{ ok: false, error }` result and the UI
 * renders them as toasts / inline alerts.
 */
export type ActionResult<T> =
  | { ok: true; entity: T }
  | { ok: false; error: string };
