import type {
  BranchReference,
  Layout,
  LayoutChangeType,
  LayoutElement,
  LayoutVersionEntry,
  VariantReference,
} from "@/features/layout/domain";
import type { PositionWithStock } from "@/features/layout/application";
import type { LayoutPermissions } from "@/features/layout/server";
import {
  archiveLayoutAction,
  confirmReplacementAction,
  detectStockChangesAction,
  publishLayoutAction,
  restoreVersionAction,
} from "@/features/layout/server";
import {
  ElementPositionStyle,
  ElementTypeBadge,
  isElementHidden,
  m1RielCapacities,
} from "./element-meta";
import { LayoutStatusBadge, ReviewStatusBadge } from "./layout-status-badge";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "./ui";

async function submitPublish(layoutId: string): Promise<void> {
  await publishLayoutAction(layoutId);
}

async function submitArchive(layoutId: string): Promise<void> {
  await archiveLayoutAction(layoutId);
}

async function submitRestore(layoutId: string, version: number): Promise<void> {
  await restoreVersionAction(layoutId, version);
}

async function submitDetectStockChanges(layoutId: string): Promise<void> {
  await detectStockChangesAction(layoutId);
}

async function submitConfirmReplacement(positionId: string, variantId: string): Promise<void> {
  await confirmReplacementAction(positionId, variantId);
}

export function LayoutEditor({
  layout,
  elements,
  positionsWithStock,
  history,
  branch,
  variantByVariantId,
  suggestions,
  permissions,
}: {
  layout: Layout;
  elements: LayoutElement[];
  positionsWithStock: PositionWithStock[];
  history: LayoutVersionEntry[];
  branch: BranchReference | null;
  variantByVariantId: ReadonlyMap<string, VariantReference>;
  suggestions: ReadonlyMap<string, VariantReference>;
  permissions: LayoutPermissions;
}) {
  const isDraft = layout.status === "draft";
  const canConfirm = isDraft && permissions.canEdit;
  const positionsByElement = new Map<string, PositionWithStock[]>();
  for (const entry of positionsWithStock) {
    const bucket = positionsByElement.get(entry.position.elementId) ?? [];
    bucket.push(entry);
    positionsByElement.set(entry.position.elementId, bucket);
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="layout-header-heading">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="layout-header-heading" className="text-xl font-bold text-gray-900">
                  {layout.name}
                </h2>
                <LayoutStatusBadge status={layout.status} />
                {!permissions.canEdit ? (
                  <Badge variant="gray">Solo lectura</Badge>
                ) : null}
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-gray-600 sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Sucursal</dt>
                  <dd>{branch?.code ?? layout.branchId}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Versión</dt>
                  <dd>v{layout.version}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Lienzo</dt>
                  <dd>
                    {layout.width !== null && layout.height !== null
                      ? `${layout.width} × ${layout.height}`
                      : "Sin definir"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium uppercase tracking-wide text-gray-400">Actualizado</dt>
                  <dd>{new Date(layout.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {canConfirm ? (
                <form action={submitDetectStockChanges.bind(null, layout.id)}>
                  <Button type="submit" variant="secondary">
                    Detectar cambios de stock
                  </Button>
                </form>
              ) : null}
              {isDraft && permissions.canPublish ? (
                <form action={submitPublish.bind(null, layout.id)}>
                  <Button type="submit" variant="primary">
                    Publicar v{layout.version}
                  </Button>
                </form>
              ) : null}
              {permissions.canManage && layout.status !== "archived" ? (
                <form action={submitArchive.bind(null, layout.id)}>
                  <Button type="submit" variant="secondary">
                    Archivar
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
          {layout.backgroundReference !== null ? (
            <p className="mt-4 text-xs text-gray-500">
              Plano de referencia:{" "}
              <a
                href={layout.backgroundReference}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline-offset-2 hover:underline"
              >
                {layout.backgroundReference}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="layout-canvas-heading">
        <Card>
          <CardHeader>
            <CardTitle id="layout-canvas-heading">Lienzo estructurado</CardTitle>
          </CardHeader>
          <CardContent>
            {elements.length === 0 ? (
              <p className="text-sm text-gray-500">El layout aún no tiene elementos.</p>
            ) : (
              <LayoutCanvas layout={layout} elements={elements} />
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="layout-elements-heading">
        <Card>
          <CardHeader>
            <CardTitle id="layout-elements-heading">Elementos y posiciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {elements.map((element) => (
                <ElementPanel
                  key={element.id}
                  element={element}
                  entries={positionsByElement.get(element.id) ?? []}
                  variantByVariantId={variantByVariantId}
                  suggestions={suggestions}
                  canConfirm={canConfirm}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="layout-history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="layout-history-heading">Historial de cambios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {CHANGE_TYPE_LABELS[entry.changeType]}
                      {entry.reason !== null ? (
                        <span className="ml-2 font-normal text-gray-500">{entry.reason}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {entry.changeType === "restored"
                        ? null
                        : `Versión v${entry.version} · ${new Date(entry.createdAt).toLocaleString()}`}
                    </p>
                  </div>
                  <Badge variant="gray">v{entry.version}</Badge>
                </div>
              ))}
            </div>
            {history.length > 1 && permissions.canPublish ? (
              <div className="border-t border-gray-100 px-5 py-4">
                <form action={submitRestore.bind(null, layout.id, layout.version - 1)}>
                  <Button type="submit" variant="outline" size="sm">
                    Restaurar versión anterior (v{layout.version - 1})
                  </Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function LayoutCanvas({ layout, elements }: { layout: Layout; elements: LayoutElement[] }) {
  const width = layout.width ?? 1;
  const height = layout.height ?? 1;
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
      style={{
        aspectRatio: `${width} / ${height}`,
        backgroundImage:
          "linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)",
        backgroundSize: "10% 10%",
      }}
    >
      {elements.map((element) => {
        const hidden = isElementHidden(element);
        const capacities = m1RielCapacities(element);
        return (
          <div
            key={element.id}
            className={
              hidden
                ? "absolute flex flex-col justify-between overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50/80 p-1 opacity-60"
                : "absolute flex flex-col justify-between overflow-hidden rounded border border-blue-200 bg-blue-50 p-1"
            }
            style={ElementPositionStyle(element)}
          >
            <div className="flex items-start justify-between gap-1">
              <ElementTypeBadge elementType={element.elementType} />
              <span className="flex gap-1">
                {element.locked ? (
                  <LockIcon aria-label="Bloqueado" />
                ) : null}
                {hidden ? <HiddenIcon aria-label="Oculto" /> : null}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold leading-tight text-gray-700">
                {element.code}
              </p>
              {element.label !== null ? (
                <p className="truncate text-[10px] leading-tight text-gray-500">{element.label}</p>
              ) : null}
            </div>
            {capacities !== null ? (
              <M1CapacityRow capacities={capacities} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function M1CapacityRow({ capacities }: { capacities: { frontal: number; intermedio: number; posterior: number } }) {
  return (
    <div className="flex items-center gap-1 text-[10px] leading-none text-gray-500" title="Capacidad por riel (F/I/P)">
      {[capacities.frontal, capacities.intermedio, capacities.posterior].map((count, index) => (
        <span key={index} className="inline-flex items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          {count}
        </span>
      ))}
    </div>
  );
}

function ElementPanel({
  element,
  entries,
  variantByVariantId,
  suggestions,
  canConfirm,
}: {
  element: LayoutElement;
  entries: PositionWithStock[];
  variantByVariantId: ReadonlyMap<string, VariantReference>;
  suggestions: ReadonlyMap<string, VariantReference>;
  canConfirm: boolean;
}) {
  const hidden = isElementHidden(element);
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{element.code}</span>
        <ElementTypeBadge elementType={element.elementType} />
        {element.locked ? <Badge variant="gray">Bloqueado</Badge> : null}
        {hidden ? <Badge variant="amber">Oculto</Badge> : null}
        {entries.some((entry) => entry.position.reviewStatus === "needs_review") ? (
          <Badge variant="red" dot>
            Revisión pendiente
          </Badge>
        ) : null}
      </div>
      {element.label !== null ? (
        <p className="mt-1 text-xs text-gray-500">{element.label}</p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">Sin posiciones.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map(({ position, stock }) => {
            const variant = position.variantId !== null ? variantByVariantId.get(position.variantId) : undefined;
            const suggestion =
              position.reviewStatus === "needs_review" && position.variantId !== null
                ? suggestions.get(position.id)
                : undefined;
            return (
              <li key={position.id} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-700">
                      {position.positionCode}
                      <span className="ml-2 font-normal text-gray-500">
                        {variant !== undefined ? `SKU ${variant.sku}` : "Vacía"}
                      </span>
                    </p>
                  </div>
                  <ReviewStatusBadge status={position.reviewStatus} />
                </div>
                {position.variantId !== null ? (
                  <StockRows stock={stock} />
                ) : null}
                {position.reviewStatus === "needs_review" && suggestion !== undefined ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Reemplazo sugerido:</span>{" "}
                      SKU {suggestion.sku}
                    </p>
                    {canConfirm ? (
                      <form
                        action={submitConfirmReplacement.bind(null, position.id, suggestion.id)}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Confirmar reemplazo
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StockRows({ stock }: { stock: PositionWithStock["stock"] }) {
  if (stock.length === 0) {
    return (
      <p className="mt-1.5 text-xs text-gray-400">
        Existencia reportada: sin datos para las bodegas de esta sucursal.
      </p>
    );
  }
  const sorted = [...stock].sort((a, b) => a.warehouseType.localeCompare(b.warehouseType));
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {sorted.map((row) => (
        <span
          key={row.warehouseId}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600"
        >
          <span className="font-medium text-gray-800">{WAREHOUSE_TYPE_LABELS[row.warehouseType]}</span>
          <span className="text-gray-900">{row.quantity} pz</span>
          <span className="text-gray-400">{new Date(row.reportDate).toLocaleDateString()}</span>
        </span>
      ))}
    </div>
  );
}

const CHANGE_TYPE_LABELS: Record<LayoutChangeType, string> = {
  created: "Layout creado",
  element_added: "Elemento agregado",
  element_changed: "Elemento modificado",
  element_moved: "Elemento movido",
  element_rotated: "Elemento rotado",
  element_resized: "Elemento redimensionado",
  element_locked: "Elemento bloqueado",
  element_hidden: "Visibilidad del elemento",
  element_duplicated: "Elemento duplicado",
  product_assigned: "Producto asignado",
  product_removed: "Producto retirado",
  published: "Publicado",
  restored: "Versión restaurada",
};

const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  store_backroom: "Tienda (backroom)",
  distribution: "CEDIS",
};

function LockIcon(props: { "aria-label": string }) {
  return (
    <svg aria-hidden={undefined} aria-label={props["aria-label"]} className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function HiddenIcon(props: { "aria-label": string }) {
  return (
    <svg aria-hidden={undefined} aria-label={props["aria-label"]} className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}
