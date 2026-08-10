import { listLayouts } from "@/features/layout/application";
import { LayoutList } from "@/features/layout/components/layout-list";
import { requireLayoutSession } from "@/features/layout/server";

export const dynamic = "force-dynamic";

export default async function LayoutListPage() {
  const access = await requireLayoutSession();
  const layouts = await listLayouts(access.context, {
    actor: access.actor,
    organizationId: access.organizationId,
  });

  const branchCodes = new Map<string, string>();
  const branchIds = [...new Set(layouts.map((layout) => layout.branchId))];
  await Promise.all(
    branchIds.map(async (branchId) => {
      const branch = await access.context.referenceCatalog.findBranchById(
        access.organizationId,
        branchId
      );
      if (branch !== null) {
        branchCodes.set(branchId, branch.code);
      }
    })
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Layouts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Planos estructurados por sucursal; toca un layout para ver su lienzo.
        </p>
      </header>
      <LayoutList layouts={layouts} branchCodeByBranchId={branchCodes} />
    </div>
  );
}
