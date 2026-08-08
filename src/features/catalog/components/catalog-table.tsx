"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Table, TableBody, TableHead, TableHeader } from "./ui/table";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
}

export interface CatalogTableProps<T> {
  columns: Column<T>[];
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  children: ReactNode;
  empty?: ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function CatalogTable<T>({
  columns,
  sortKey,
  sortDirection,
  onSort,
  children,
  empty,
  page = 1,
  pageSize,
  total,
  onPageChange,
}: CatalogTableProps<T>) {
  const totalPages = pageSize !== undefined && total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  function toggleSort(key: string) {
    if (onSort !== undefined) {
      onSort(key);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <tr>
            {columns.map((column) => {
              const active = sortKey === column.key;
              const isSortable = column.sortable === true && onSort !== undefined;
              return (
                <TableHead key={column.key} className={cn(column.align === "right" && "text-right")}>
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Ordenar por ${column.label}`}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-900"
                    >
                      {column.label}
                      <span aria-hidden className="text-[10px]">
                        {active
                          ? sortDirection === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              );
            })}
          </tr>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>

      {empty !== undefined ? (
        <div className="border-t border-gray-100">{empty}</div>
      ) : null}

      {totalPages > 1 && onPageChange !== undefined ? (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            Página {page} de {totalPages}
            {total !== undefined ? ` · ${total} registros` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
