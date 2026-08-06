import Link from "next/link";
import { listProducts } from "@/features/catalog/application";
import {
  archiveProductAction,
  duplicateProductAction,
  restoreProductAction,
} from "@/features/catalog/server/actions";
import { buildProductTableRows, requireCatalogSession } from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ProductsTable } from "@/features/catalog/components/products-table";

export const dynamic = "force-dynamic";

export default async function CatalogProductsPage() {
  const access = await requireCatalogSession();
  const products = await listProducts(access.context, {
    actor: access.actor,
    organizationId: access.organizationId,
  });
  const rows = await buildProductTableRows(access.context, access.organizationId, products);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Administra el catálogo de productos y sus estados."
        actions={
          access.permissions.canCreate ? (
            <Link
              href="/admin/catalog/products/new"
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span aria-hidden>+</span> Nuevo producto
            </Link>
          ) : null
        }
      />

      <ProductsTable
        rows={rows}
        permissions={access.permissions}
        actions={{
          archive: archiveProductAction,
          restore: restoreProductAction,
          duplicate: duplicateProductAction,
        }}
      />
    </div>
  );
}
