import type { LayoutContext } from "./layout-context";
import type { Layout, LayoutElement, LayoutPosition } from "../domain";
import { LayoutValidationError, requireLayoutEntity } from "../domain";

/**
 * Edition happens on draft only (D-L04, LA-9): every editing use case must
 * resolve its target layout and assert it is a `draft`. Published/archived
 * layouts are never edited in place.
 */
export async function requireEditableLayout(
  context: LayoutContext,
  organizationId: string,
  layoutId: string
): Promise<Layout> {
  const layout = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  if (layout.status !== "draft") {
    throw new LayoutValidationError(
      `Layout ${layoutId} is ${layout.status}; editing is only allowed on draft layouts (D-L04)`
    );
  }
  return layout;
}

/** Resolves an element and asserts its layout is editable. */
export async function requireEditableElement(
  context: LayoutContext,
  organizationId: string,
  elementId: string
): Promise<LayoutElement> {
  const element = requireLayoutEntity(
    await context.layoutRepository.findElementById(organizationId, elementId),
    "layout_element",
    elementId
  );
  await requireEditableLayout(context, organizationId, element.layoutId);
  return element;
}

/** Resolves a position, its element and its editable layout. */
export async function requireEditablePosition(
  context: LayoutContext,
  organizationId: string,
  positionId: string
): Promise<{ position: LayoutPosition; element: LayoutElement; layout: Layout }> {
  const position = requireLayoutEntity(
    await context.layoutRepository.findPositionById(organizationId, positionId),
    "layout_position",
    positionId
  );
  const element = requireLayoutEntity(
    await context.layoutRepository.findElementById(organizationId, position.elementId),
    "layout_element",
    position.elementId
  );
  const layout = await requireEditableLayout(context, organizationId, element.layoutId);
  return { position, element, layout };
}
