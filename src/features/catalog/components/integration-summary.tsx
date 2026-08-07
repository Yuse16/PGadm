import type { CatalogIntegrationSummary } from "@/features/catalog/domain";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const currencyFormat = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * 1C.5 integration placeholders for inventory, purchases and pricing. Nothing
 * is implemented in this phase (Fase 1C.5 scope), so in demo mode it renders
 * "Sin integración de inventario" and every integration point shows "—".
 * Future phases fill these fields through CatalogIntegrationRepository.
 */
export function IntegrationSummaryCard({
  summary,
}: {
  summary: CatalogIntegrationSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario y precios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!summary.status.integrated ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {summary.status.message}
          </div>
        ) : null}
        <section>
          <SectionTitle>Inventario</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
            <InfoRow label="Stock actual" value={formatNumber(summary.inventory.currentStock)} />
            <InfoRow label="Stock reservado" value={formatNumber(summary.inventory.reservedStock)} />
            <InfoRow label="Stock disponible" value={formatNumber(summary.inventory.availableStock)} />
            <InfoRow label="Costo promedio" value={formatCurrency(summary.inventory.averageCost)} />
            <InfoRow label="Último costo" value={formatCurrency(summary.inventory.lastCost)} />
          </dl>
        </section>
        <section>
          <SectionTitle>Compras</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
            <InfoRow label="Último proveedor" value={summary.purchase.lastSupplier} />
            <InfoRow label="Última compra" value={formatDate(summary.purchase.lastPurchaseAt)} />
            <InfoRow label="Costo de última compra" value={formatCurrency(summary.purchase.lastPurchaseCost)} />
          </dl>
        </section>
        <section>
          <SectionTitle>Precios</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
            <InfoRow label="Precio base" value={formatCurrency(summary.pricing.basePrice)} />
            <InfoRow label="Precio sugerido" value={formatCurrency(summary.pricing.suggestedPrice)} />
            <InfoRow label="Precio de venta" value={formatCurrency(summary.pricing.salePrice)} />
            <InfoRow label="Precio especial" value={formatCurrency(summary.pricing.specialPrice)} />
            <InfoRow label="Lista de precios" value={summary.pricing.priceList} />
          </dl>
        </section>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value ?? "—"}</dd>
    </div>
  );
}

function formatNumber(value: number | null): string | null {
  return value === null ? null : new Intl.NumberFormat("es-MX").format(value);
}

function formatCurrency(value: number | null): string | null {
  return value === null ? null : currencyFormat.format(value);
}

function formatDate(value: string | null): string | null {
  if (value === null || Number.isNaN(new Date(value).getTime())) {
    return null;
  }
  return dateFormat.format(new Date(value));
}
