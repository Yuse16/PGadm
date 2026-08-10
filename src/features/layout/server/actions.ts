"use server";

import type { LayoutContext } from "@/features/layout/application";
import {
  addElement,
  archiveLayout,
  assignProduct,
  confirmReplacement,
  createLayout,
  detectStockChanges,
  duplicateElement,
  hideElement,
  layoutActorFromIdentitySession,
  lockElement,
  markNeedsReview,
  moveElement,
  publishLayout,
  removeProduct,
  requireLayoutEdit,
  requireLayoutManage,
  requireLayoutPublish,
  resizeElement,
  restoreVersion,
  rotateElement,
} from "@/features/layout/application";
import type { LayoutActor, LayoutElementType } from "@/features/layout/domain";
import {
  LayoutError,
  LayoutPermissionError,
  RepositoryConfigurationError,
} from "@/features/layout/domain";
import type { IdentitySession } from "@/features/identity/domain";
import { getLayoutContext } from "./context";

/**
 * Result envelope for layout server actions. Server actions cannot return
 * thrown errors to the client (they become generic 500s), so every action maps
 * Layout* errors into a `{ ok: false, error }` result and the UI renders them
 * as toasts / inline alerts.
 */
export type ActionResult<T> =
  | { ok: true; entity: T }
  | { ok: false; error: string };

type Mutation<T> = (
  context: LayoutContext,
  actor: LayoutActor,
  organizationId: string
) => Promise<T>;

/**
 * Wraps every server action: guards first (authorization is decided server-side,
 * never from client payloads), then runs the mutation inside the actor's own
 * organization. Layout errors become `{ ok: false }` results so the UI can
 * render them as toasts; Next navigation redirects (login/forbidden) are
 * re-thrown untouched.
 */
async function runMutation<T>(
  guard: () => Promise<IdentitySession>,
  mutate: Mutation<T>
): Promise<ActionResult<T>> {
  try {
    const session = await guard();
    const actor = layoutActorFromIdentitySession(session);
    const organizationId = session.organizationId;
    if (organizationId === null) {
      throw new LayoutPermissionError("layout.read");
    }
    const context = await getLayoutContext();
    const entity = await mutate(context, actor, organizationId);
    return { ok: true, entity };
  } catch (error) {
    if (isNextNavigation(error)) {
      throw error;
    }
    return { ok: false, error: toUserMessage(error) };
  }
}

function isNextNavigation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

function toUserMessage(error: unknown): string {
  if (error instanceof RepositoryConfigurationError) {
    return "La base de datos no está configurada. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  if (error instanceof LayoutPermissionError) {
    return "No tienes permisos para realizar esta operación.";
  }
  if (error instanceof LayoutError) {
    return error.message;
  }
  if (error instanceof Error && error.message !== "") {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}

/* ------------------------------------------------------------------ */
/* Layout lifecycle                                                    */
/* ------------------------------------------------------------------ */

export async function createLayoutAction(input: {
  branchId: string;
  name: string;
  width?: number | null;
  height?: number | null;
  backgroundReference?: string | null;
}): Promise<ActionResult<Awaited<ReturnType<typeof createLayout>>>> {
  return runMutation(requireLayoutManage, (context, actor, organizationId) =>
    createLayout(context, { actor, organizationId, ...input })
  );
}

export async function archiveLayoutAction(
  layoutId: string
): Promise<ActionResult<Awaited<ReturnType<typeof archiveLayout>>>> {
  return runMutation(requireLayoutManage, (context, actor, organizationId) =>
    archiveLayout(context, { actor, organizationId, layoutId })
  );
}

export async function publishLayoutAction(
  layoutId: string
): Promise<ActionResult<Awaited<ReturnType<typeof publishLayout>>>> {
  return runMutation(requireLayoutPublish, (context, actor, organizationId) =>
    publishLayout(context, { actor, organizationId, layoutId })
  );
}

export async function restoreVersionAction(
  layoutId: string,
  version: number
): Promise<ActionResult<Awaited<ReturnType<typeof restoreVersion>>>> {
  return runMutation(requireLayoutPublish, (context, actor, organizationId) =>
    restoreVersion(context, { actor, organizationId, layoutId, version })
  );
}

export async function detectStockChangesAction(
  layoutId: string
): Promise<ActionResult<Awaited<ReturnType<typeof detectStockChanges>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    detectStockChanges(context, { actor, organizationId, layoutId })
  );
}

/* ------------------------------------------------------------------ */
/* Elements                                                            */
/* ------------------------------------------------------------------ */

export async function addElementAction(input: {
  layoutId: string;
  elementType: LayoutElementType;
  code: string;
  label?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
}): Promise<ActionResult<Awaited<ReturnType<typeof addElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    addElement(context, { actor, organizationId, ...input })
  );
}

export async function moveElementAction(
  elementId: string,
  x: number,
  y: number
): Promise<ActionResult<Awaited<ReturnType<typeof moveElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    moveElement(context, { actor, organizationId, elementId, x, y })
  );
}

export async function rotateElementAction(
  elementId: string,
  rotation: number
): Promise<ActionResult<Awaited<ReturnType<typeof rotateElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    rotateElement(context, { actor, organizationId, elementId, rotation })
  );
}

export async function resizeElementAction(
  elementId: string,
  width: number,
  height: number
): Promise<ActionResult<Awaited<ReturnType<typeof resizeElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    resizeElement(context, { actor, organizationId, elementId, width, height })
  );
}

export async function lockElementAction(
  elementId: string,
  locked: boolean
): Promise<ActionResult<Awaited<ReturnType<typeof lockElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    lockElement(context, { actor, organizationId, elementId, locked })
  );
}

export async function hideElementAction(
  elementId: string,
  hidden: boolean
): Promise<ActionResult<Awaited<ReturnType<typeof hideElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    hideElement(context, { actor, organizationId, elementId, hidden })
  );
}

export async function duplicateElementAction(
  elementId: string,
  code: string
): Promise<ActionResult<Awaited<ReturnType<typeof duplicateElement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    duplicateElement(context, { actor, organizationId, elementId, code })
  );
}

/* ------------------------------------------------------------------ */
/* Positions / product                                                 */
/* ------------------------------------------------------------------ */

export async function assignProductAction(
  positionId: string,
  variantId: string,
  reason?: string
): Promise<ActionResult<Awaited<ReturnType<typeof assignProduct>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    assignProduct(context, { actor, organizationId, positionId, variantId, reason })
  );
}

export async function removeProductAction(
  positionId: string,
  reason?: string
): Promise<ActionResult<Awaited<ReturnType<typeof removeProduct>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    removeProduct(context, { actor, organizationId, positionId, reason })
  );
}

export async function markNeedsReviewAction(
  positionId: string,
  reason?: string
): Promise<ActionResult<Awaited<ReturnType<typeof markNeedsReview>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    markNeedsReview(context, { actor, organizationId, positionId, reason })
  );
}

export async function confirmReplacementAction(
  positionId: string,
  variantId: string | null,
  reason?: string
): Promise<ActionResult<Awaited<ReturnType<typeof confirmReplacement>>>> {
  return runMutation(requireLayoutEdit, (context, actor, organizationId) =>
    confirmReplacement(context, {
      actor,
      organizationId,
      positionId,
      variantId: variantId ?? undefined,
      reason,
    })
  );
}
