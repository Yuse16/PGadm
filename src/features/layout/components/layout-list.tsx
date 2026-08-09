import Link from "next/link";
import type { Layout } from "@/features/layout/domain";
import { LayoutStatusBadge } from "./layout-status-badge";
import { Card, CardContent, EmptyState } from "./ui";

export function LayoutList({
  layouts,
  branchCodeByBranchId,
}: {
  layouts: Layout[];
  branchCodeByBranchId: ReadonlyMap<string, string>;
}) {
  if (layouts.length === 0) {
    return (
      <EmptyState
        title="Aún no hay layouts"
        description="Crea el primer plano estructurado de una sucursal para comenzar."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {layouts.map((layout) => (
        <Link key={layout.id} href={`/admin/layout/${layout.id}`} className="group">
          <Card className="h-full transition-colors group-hover:border-blue-300">
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {layout.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {branchCodeByBranchId.get(layout.branchId) ?? layout.branchId}
                  </p>
                </div>
                <LayoutStatusBadge status={layout.status} />
              </div>
              <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Versión</dt>
                  <dd className="mt-0.5 text-gray-700">v{layout.version}</dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Lienzo</dt>
                  <dd className="mt-0.5 text-gray-700">
                    {layout.width !== null && layout.height !== null
                      ? `${layout.width} × ${layout.height}`
                      : "Sin definir"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Actualizado</dt>
                  <dd className="mt-0.5 text-gray-700">
                    {new Date(layout.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Creado</dt>
                  <dd className="mt-0.5 text-gray-700">
                    {new Date(layout.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
