import type { CatalogAuditAction, CatalogAuditEntityType } from "@/features/catalog/domain";
import type { ProductHistoryEntry } from "@/features/catalog/server/history";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";

const ACTION_LABELS: Record<CatalogAuditAction, string> = {
  create: "Creación",
  update: "Actualización",
  archive: "Descontinuado",
  restore: "Restaurado",
};

const ACTION_ACCENTS: Record<CatalogAuditAction, string> = {
  create: "bg-blue-100 text-blue-700",
  update: "bg-gray-100 text-gray-700",
  archive: "bg-red-100 text-red-700",
  restore: "bg-green-100 text-green-700",
};

const ENTITY_LABELS: Record<CatalogAuditEntityType, string> = {
  product: "Producto",
  variant: "Variante",
  barcode: "Código de barras",
  category: "Categoría",
  brand: "Marca",
  line: "Línea",
  unit: "Unidad",
};

const dateTimeFormat = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function HistoryTimeline({ entries }: { entries: ProductHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Sin actividad registrada"
            description="Los cambios sobre este producto y sus variantes aparecerán aquí."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ol className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_ACCENTS[entry.action]}`}
              >
                {ACTION_LABELS[entry.action]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">{entry.detail}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {ENTITY_LABELS[entry.entityType]} ·{" "}
                  <time dateTime={entry.occurredAt}>
                    {dateTimeFormat.format(new Date(entry.occurredAt))}
                  </time>
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {entry.actorUserId.slice(0, 8)}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
