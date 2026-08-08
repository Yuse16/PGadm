import Link from "next/link";
import type { ReactNode } from "react";
import { getProduct } from "@/features/catalog/application";
import type { CatalogNotFoundError } from "@/features/catalog/domain";
import {
  addBarcodeAction,
  archiveVariantAction,
  changePrimaryBarcodeAction,
  createVariantAction,
  restoreVariantAction,
  updateProductAction,
  updateVariantAction,
} from "@/features/catalog/server/actions";
import {
  flattenCategoriesWithDepth,
  getProductHistory,
  requireCatalogSession,
} from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ProductForm } from "@/features/catalog/components/product-form";
import { StatusBadge } from "@/features/catalog/components/status-badge";
import { VariantTable } from "@/features/catalog/components/variant-table";
import { HistoryTimeline } from "@/features/catalog/components/history-timeline";
import { IntegrationSummaryCard } from "@/features/catalog/components/integration-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/catalog/components/ui/card";
import { EmptyState } from "@/features/catalog/components/ui/empty-state";
import { getProductIntegrationSummary } from "@/features/inventory/server";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireCatalogSession();

  let detail;
  try {
    detail = await getProduct(access.context, {
      actor: access.actor,
      organizationId: access.organizationId,
      productId: id,
    });
  } catch (error) {
    if ((error as CatalogNotFoundError).name === "CatalogNotFoundError") {
      return (
        <div className="space-y-6">
          <PageHeader title="Producto no encontrado" />
          <EmptyState
            title="No se encontró el producto"
            description="Puede que haya sido eliminado o que la URL sea incorrecta."
            action={
              <Link
                href="/admin/catalog/products"
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Volver a productos
              </Link>
            }
          />
        </div>
      );
    }
    throw error;
  }

  const { product, variants } = detail;

  const [brands, categories, lines, units] = await Promise.all([
    access.context.brandRepository.listBrands(access.organizationId),
    access.context.categoryRepository.listCategories(access.organizationId),
    access.context.productLineRepository.listProductLines(access.organizationId),
    access.context.unitRepository.listUnits(access.organizationId),
  ]);

  const brand = brands.find((item) => item.id === product.brandId);
  const category = categories.find((item) => item.id === product.categoryId);
  const line = lines.find((item) => item.id === product.lineId);

  const isDiscontinued = product.status === "discontinued";
  const canEdit = access.permissions.canUpdate && !isDiscontinued;

  const history = await getProductHistory(
    access.context,
    access.organizationId,
    product,
    variants.map((item) => item.variant)
  );

  const integrationSummary = await getProductIntegrationSummary(
    variants.map((item) => item.variant.id)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={product.description}
        description={product.externalId ?? "Sin SKU externo"}
        actions={
          <Link
            href="/admin/catalog/products"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Productos
          </Link>
        }
      />

      {isDiscontinued ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este producto está <strong>Descontinuado</strong>. Para editarlo primero debes
          restaurarlo desde el listado de productos.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="SKU externo" value={product.externalId ?? "—"} />
            <InfoRow label="Nombre corto" value={product.shortName ?? "—"} />
            <InfoRow label="Marca" value={brand?.name ?? "—"} />
            <InfoRow label="Categoría" value={category?.name ?? "—"} />
            <InfoRow label="Línea" value={line?.name ?? "—"} />
            <InfoRow label="Estado" value={<StatusBadge status={product.status} />} />
            <InfoRow
              label="Creado"
              value={new Date(product.createdAt).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <InfoRow
              label="Última modificación"
              value={new Date(product.updatedAt).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-sm font-medium text-gray-500">Descripción técnica</dt>
              <dd className="mt-1 text-sm text-gray-800">
                {product.technicalDescription ?? "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="mx-auto max-w-3xl">
          <ProductForm
            mode="edit"
            initial={{
              externalId: product.externalId,
              description: product.description,
              shortName: product.shortName,
              brandId: product.brandId,
              categoryId: product.categoryId,
              lineId: product.lineId,
              technicalDescription: product.technicalDescription,
            }}
            initialStatus={product.status === "inactive" ? "inactive" : "active"}
            brands={brands.map((item) => ({ id: item.id, name: item.name }))}
            categories={flattenCategoriesWithDepth(categories)}
            lines={lines.map((item) => ({ id: item.id, name: item.name }))}
            onSubmit={updateProductAction.bind(null, product.id)}
          />
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Variantes y códigos
        </h2>
        <VariantTable
          productId={product.id}
          rows={variants}
          units={units}
          canCreate={access.permissions.canCreate}
          canUpdate={access.permissions.canUpdate}
          canArchive={access.permissions.canArchive}
          canManage={access.permissions.canManage}
          actions={{
            create: createVariantAction.bind(null, product.id),
            update: updateVariantAction.bind(null, product.id),
            archive: archiveVariantAction.bind(null, product.id),
            restore: restoreVariantAction.bind(null, product.id),
            addBarcode: addBarcodeAction,
            changePrimary: changePrimaryBarcodeAction,
          }}
        />
      </section>

      <IntegrationSummaryCard summary={integrationSummary} />

      <HistoryTimeline entries={history} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value}</dd>
    </div>
  );
}
