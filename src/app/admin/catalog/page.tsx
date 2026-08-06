import Link from "next/link";
import type { ReactNode } from "react";
import { listProducts } from "@/features/catalog/application";
import {
  buildProductTableRows,
  getCatalogStats,
  requireCatalogSession,
  sortByUpdatedAtDesc,
} from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { QuickLinkCard, StatCard } from "@/features/catalog/components/product-card";
import { StatusBadge } from "@/features/catalog/components/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/features/catalog/components/ui/card";
import { EmptyState } from "@/features/catalog/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CatalogDashboardPage() {
  const access = await requireCatalogSession();
  const stats = await getCatalogStats(access.context, access.organizationId);
  const products = await listProducts(access.context, {
    actor: access.actor,
    organizationId: access.organizationId,
  });
  const recent = sortByUpdatedAtDesc(products).slice(0, 5);
  const rows = await buildProductTableRows(access.context, access.organizationId, recent);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resumen"
        description="Indicadores y accesos rápidos del catálogo de productos."
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={stats.products} href="/admin/catalog/products" accent="blue" />
        <StatCard label="Variantes" value={stats.variants} href="/admin/catalog/variants" accent="green" />
        <StatCard label="Categorías" value={stats.categories} href="/admin/catalog/categories" accent="amber" />
        <StatCard label="Marcas" value={stats.brands} href="/admin/catalog/brands" accent="gray" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLinkCard
            href="/admin/catalog/products"
            icon={<FolderIcon />}
            title="Productos"
            description="Listado, búsqueda y filtros"
          />
          <QuickLinkCard
            href="/admin/catalog/variants"
            icon={<TagIcon />}
            title="Variantes y códigos"
            description="SKU, presentaciones y códigos de barras"
          />
          <QuickLinkCard
            href="/admin/catalog/categories"
            icon={<TreeIcon />}
            title="Categorías"
            description="Árbol de hasta 3 niveles"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Productos recientes
        </h2>
        {rows.length === 0 ? (
          <EmptyState
            title="Aún no hay productos"
            description="Crea tu primer producto para comenzar a armar el catálogo."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Últimos productos actualizados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <Link
                    key={row.product.id}
                    href={`/admin/catalog/products/${row.product.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.product.description}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {row.brandName ?? "Sin marca"}
                        {row.categoryName ? ` · ${row.categoryName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-gray-400">{row.variantCount} variantes</span>
                      <StatusBadge status={row.product.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FolderIcon(): ReactNode {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function TagIcon(): ReactNode {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function TreeIcon(): ReactNode {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0V9m6-5.25h.008v.008H9.75V3.75zM9.75 9.75h.008v.008H9.75V9.75zM9.75 15.75h.008v.008H9.75v-.008zM15.75 9.75h.008v.008H15.75V9.75zM15.75 15.75h.008v.008H15.75v-.008zM15.75 21h.008v.008H15.75V21z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12.75h4.5m-4.5 0v4.5m0-4.5h-4.5" />
    </svg>
  );
}
