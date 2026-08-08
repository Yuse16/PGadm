"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ProductTableRow } from "@/features/catalog/server";
import type { CatalogPermissions } from "./permissions";
import type { ActionResult } from "./action-results";
import { StatusBadge } from "./status-badge";
import { CatalogTable } from "./catalog-table";
import type { SortDirection } from "./catalog-table";
import { CatalogToolbar } from "./catalog-toolbar";
import { CatalogFilters } from "./catalog-filters";
import { SearchInput } from "./ui/search-input";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { DeleteDisabledDialog } from "./delete-disabled-dialog";
import { ArchiveDialog } from "./archive-dialog";
import { useToast } from "./ui/toast";

const PAGE_SIZE = 10;

export interface ProductsTableActions {
  archive: (productId: string) => Promise<ActionResult<unknown>>;
  restore: (productId: string) => Promise<ActionResult<unknown>>;
  duplicate: (productId: string) => Promise<ActionResult<unknown>>;
}

export function ProductsTable({
  rows,
  permissions,
  actions,
}: {
  rows: ProductTableRow[];
  permissions: CatalogPermissions;
  actions: ProductsTableActions;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<ProductTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ProductTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductTableRow | null>(null);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filteredRows = rows.filter((row) => {
      if (status !== "all" && row.product.status !== status) return false;
      if (needle === "") return true;
      const haystack = [
        row.product.externalId ?? "",
        row.product.description,
        row.product.shortName ?? "",
        row.brandName ?? "",
        row.categoryName ?? "",
        row.lineName ?? "",
      ].join(" ");
      return haystack.toLowerCase().includes(needle);
    });

    const sorted = [...filteredRows].sort((a, b) => {
      const av = rowValue(a);
      const bv = rowValue(b);
      const result = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, status, sortKey, sortDirection]);

  function rowValue(row: ProductTableRow): string | number {
    switch (sortKey) {
      case "description":
        return row.product.description;
      case "externalId":
        return row.product.externalId ?? "";
      case "brand":
        return row.brandName ?? "";
      case "category":
        return row.categoryName ?? "";
      case "line":
        return row.lineName ?? "";
      case "status":
        return row.product.status;
      case "variantCount":
        return row.variantCount;
      default:
        return row.product.updatedAt;
    }
  }

  function handleSort(key: string) {
    setSortKey(key);
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function runAction(action: () => Promise<ActionResult<unknown>>, successTitle: string) {
    setPending(true);
    try {
      const result = await action();
      if (result.ok) {
        toast({ title: successTitle, variant: "success" });
        router.refresh();
      } else {
        toast({ title: "No se pudo completar la acción", description: result.error, variant: "error" });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <CatalogToolbar
        search={
          <SearchInput
            placeholder="Buscar por SKU, nombre, marca, categoría o línea…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="w-full md:w-80"
          />
        }
        filters={
          <CatalogFilters
            status={status}
            onStatusChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            statusOptions={[
              { value: "all", label: "Todos los estados" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
              { value: "discontinued", label: "Descontinuados" },
            ]}
          />
        }
        actions={
          permissions.canCreate ? (
            <Link
              href="/admin/catalog/products/new"
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span aria-hidden>+</span> Nuevo producto
            </Link>
          ) : null
        }
      />

      {pageRows.length === 0 ? (
        <EmptyState
          title={query !== "" || status !== "all" ? "Sin resultados" : "Aún no hay productos"}
          description={
            query !== "" || status !== "all"
              ? "Ajusta la búsqueda o los filtros."
              : "Crea tu primer producto para comenzar a armar el catálogo."
          }
        />
      ) : (
        <CatalogTable<ProductTableRow>
          columns={[
            { key: "externalId", label: "SKU", sortable: true },
            { key: "description", label: "Nombre", sortable: true },
            { key: "brand", label: "Marca", sortable: true },
            { key: "category", label: "Categoría", sortable: true },
            { key: "line", label: "Línea", sortable: true },
            { key: "status", label: "Estado", sortable: true },
            { key: "variantCount", label: "Variantes", sortable: true, align: "right" },
            { key: "updatedAt", label: "Última modificación", sortable: true },
            { key: "actions", label: "Acciones" },
          ]}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        >
          {pageRows.map((row) => (
            <tr key={row.product.id}>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {row.product.externalId ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/catalog/products/${row.product.id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {row.product.description}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{row.brandName ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{row.categoryName ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{row.lineName ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.product.status} />
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{row.variantCount}</td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(row.product.updatedAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/catalog/products/${row.product.id}`}
                    className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Editar
                  </Link>
                  {permissions.canCreate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        runAction(() => actions.duplicate(row.product.id), "Producto duplicado");
                      }}
                    >
                      Duplicar
                    </Button>
                  ) : null}
                  {row.product.status === "discontinued" ? (
                    permissions.canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => setRestoreTarget(row)}
                      >
                        Restaurar
                      </Button>
                    ) : null
                  ) : permissions.canArchive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setArchiveTarget(row)}
                    >
                      Archivar
                    </Button>
                  ) : null}
                  {permissions.canUpdate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(row)}
                      aria-label="Eliminar (no disponible)"
                    >
                      Eliminar
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </CatalogTable>
      )}

      <ArchiveDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() =>
          runAction(
            () => actions.archive(archiveTarget?.product.id ?? ""),
            "Producto archivado"
          )
        }
        title="Archivar producto"
        description={
          archiveTarget !== null
            ? `El producto “${archiveTarget.product.description}” pasará a estado Descontinuado.`
            : undefined
        }
        confirmLabel="Archivar"
        loading={pending}
      />
      <ArchiveDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() =>
          runAction(
            () => actions.restore(restoreTarget?.product.id ?? ""),
            "Producto restaurado"
          )
        }
        title="Restaurar producto"
        description={
          restoreTarget !== null
            ? `El producto “${restoreTarget.product.description}” volverá a estar Inactivo.`
            : undefined
        }
        confirmLabel="Restaurar"
        loading={pending}
      />
      <DeleteDisabledDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        entityName="producto"
      />
    </div>
  );
}
