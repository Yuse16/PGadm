import Link from "next/link";
import {
  getLayout,
  listPositionsWithStock,
  listVersionHistory,
  suggestCompatibleReplacement,
} from "@/features/layout/application";
import type { LayoutNotFoundError } from "@/features/layout/domain";
import { LayoutEditor } from "@/features/layout/components/layout-editor";
import { EmptyState } from "@/features/layout/components/ui";
import { requireLayoutSession } from "@/features/layout/server";

export const dynamic = "force-dynamic";

export default async function LayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireLayoutSession();

  let layout;
  let elements;
  let positions;
  try {
    const detail = await getLayout(access.context, {
      actor: access.actor,
      organizationId: access.organizationId,
      layoutId: id,
    });
    layout = detail.layout;
    elements = detail.elements;
    positions = detail.positions;
  } catch (error) {
    if ((error as LayoutNotFoundError).name === "LayoutNotFoundError") {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Layout no encontrado</h1>
          <EmptyState
            title="No se encontró el layout"
            description="Puede que haya sido archivado o que la URL sea incorrecta."
            action={
              <Link
                href="/admin/layout"
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Volver a layouts
              </Link>
            }
          />
        </div>
      );
    }
    throw error;
  }

  const [positionsWithStock, history, branch] = await Promise.all([
    listPositionsWithStock(access.context, {
      actor: access.actor,
      organizationId: access.organizationId,
      layoutId: id,
    }),
    listVersionHistory(access.context, {
      actor: access.actor,
      organizationId: access.organizationId,
      layoutId: id,
    }),
    access.context.referenceCatalog.findBranchById(access.organizationId, layout.branchId),
  ]);

  const variantIds = [
    ...new Set(
      positions
        .map((position) => position.variantId)
        .filter((variantId): variantId is string => variantId !== null)
    ),
  ];
  const variantByVariantId = new Map<string, { id: string; sku: string }>();
  await Promise.all(
    variantIds.map(async (variantId) => {
      const variant = await access.context.referenceCatalog.findVariantById(
        access.organizationId,
        variantId
      );
      if (variant !== null) {
        variantByVariantId.set(variantId, variant);
      }
    })
  );

  const suggestions = new Map<string, { id: string; sku: string }>();
  await Promise.all(
    positions
      .filter((position) => position.reviewStatus === "needs_review")
      .map(async (position) => {
        const suggestion = await suggestCompatibleReplacement(access.context, {
          actor: access.actor,
          organizationId: access.organizationId,
          layoutId: id,
          positionId: position.id,
        });
        if (suggestion !== null) {
          suggestions.set(position.id, suggestion);
        }
      })
  );

  return (
    <LayoutEditor
      layout={layout}
      elements={elements}
      positionsWithStock={positionsWithStock}
      history={history}
      branch={branch}
      variantByVariantId={variantByVariantId}
      suggestions={suggestions}
      permissions={access.permissions}
    />
  );
}
