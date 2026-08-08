import Link from "next/link";
import { getProduct, listProducts } from "@/features/catalog/application";
import {
  addBarcodeAction,
  archiveVariantAction,
  changePrimaryBarcodeAction,
  createVariantAction,
  restoreVariantAction,
  updateVariantAction,
} from "@/features/catalog/server/actions";
import { requireCatalogSession } from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { StatusBadge } from "@/features/catalog/components/status-badge";
import { VariantTable } from "@/features/catalog/components/variant-table";
import { EmptyState } from "@/features/catalog/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CatalogVariantsPage() {
  const access = await requireCatalogSession();
  const products = await listProducts(access.context, {
    actor: access.actor,
    organizationId: access.organizationId,
  });
  const units = await access.context.unitRepository.listUnits(access.organizationId);

  const groups = await Promise.all(
    products.map(async (product) => {
      const detail = await getProduct(access.context, {
        actor: access.actor,
        organizationId: access.organizationId,
        productId: product.id,
      });
      return { product, variants: detail.variants };
    })
  );

  const withVariants = groups.filter((group) => group.variants.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Variantes"
        description="SKU, presentaciones y códigos de barras agrupados por producto."
      />

      {withVariants.length === 0 ? (
        <EmptyState
          title="Sin variantes"
          description="Las variantes se administran desde la ficha de cada producto."
        />
      ) : (
        withVariants.map((group) => (
          <section key={group.product.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/admin/catalog/products/${group.product.id}`}
                className="font-medium text-blue-700 hover:underline"
              >
                {group.product.description}
              </Link>
              <StatusBadge status={group.product.status} />
            </div>
            <VariantTable
              productId={group.product.id}
              rows={group.variants}
              units={units}
              canCreate={access.permissions.canCreate}
              canUpdate={access.permissions.canUpdate}
              canArchive={access.permissions.canArchive}
              canManage={access.permissions.canManage}
              actions={{
                create: createVariantAction.bind(null, group.product.id),
                update: updateVariantAction.bind(null, group.product.id),
                archive: archiveVariantAction.bind(null, group.product.id),
                restore: restoreVariantAction.bind(null, group.product.id),
                addBarcode: addBarcodeAction,
                changePrimary: changePrimaryBarcodeAction,
              }}
            />
          </section>
        ))
      )}
    </div>
  );
}
