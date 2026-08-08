import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CatalogToolbar({
  search,
  filters,
  actions,
  className,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4",
        "md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {search}
        {filters}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
