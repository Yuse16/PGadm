"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Barcode, Unit, Variant, VariantDraft } from "@/features/catalog/domain";
import type { ActionResult } from "./action-results";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, Input, Select } from "./ui/input";
import { EmptyState } from "./ui/empty-state";
import { ArchiveDialog } from "./archive-dialog";
import { useToast } from "./ui/toast";

export interface VariantRow {
  variant: Variant;
  barcodes: Barcode[];
}

export interface VariantTableActions {
  create: (variant: VariantDraft) => Promise<ActionResult<unknown>>;
  update: (
    variantId: string,
    variant: VariantDraft,
    status: "active" | "inactive"
  ) => Promise<ActionResult<unknown>>;
  archive: (variantId: string) => Promise<ActionResult<unknown>>;
  restore: (variantId: string) => Promise<ActionResult<unknown>>;
  addBarcode: (variantId: string, barcode: string, isPrimary: boolean) => Promise<ActionResult<unknown>>;
  changePrimary: (variantId: string, barcodeId: string) => Promise<ActionResult<unknown>>;
}

export function VariantTable({
  productId,
  rows,
  units,
  canCreate,
  canUpdate,
  canArchive,
  canManage,
  actions,
}: {
  productId: string;
  rows: VariantRow[];
  units: Unit[];
  canCreate: boolean;
  canUpdate: boolean;
  canArchive: boolean;
  canManage: boolean;
  actions: VariantTableActions;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VariantRow | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<VariantRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<VariantRow | null>(null);
  const [barcodeTarget, setBarcodeTarget] = useState<VariantRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(
    action: () => Promise<ActionResult<unknown>>,
    successTitle: string
  ): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (result.ok) {
        toast({ title: successTitle, variant: "success" });
        router.refresh();
        return true;
      }
      setError(result.error);
      toast({ title: "No se pudo completar la acción", description: result.error, variant: "error" });
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {rows.length} variante{rows.length === 1 ? "" : "s"}
        </p>
        {canCreate ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <span aria-hidden>+</span> Nueva variante
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Sin variantes" description="Agrega una variante con su SKU, unidades y precio." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">SKU</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Unidades</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Precio</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Códigos</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const { variant, barcodes } = row;
                const primary = barcodes.find((barcode) => barcode.isPrimary);
                const secondary = barcodes.filter((barcode) => !barcode.isPrimary);
                const baseUnit = units.find((unit) => unit.id === variant.baseUnitId);
                const saleUnit = units.find((unit) => unit.id === variant.saleUnitId);
                return (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{variant.sku}</td>
                    <td className="px-4 py-3 text-gray-700">{variant.displayName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {baseUnit?.code ?? "?"} → {saleUnit?.code ?? "?"}
                      <span className="text-gray-400"> ({variant.baseUnitsPerSaleUnit}/venta)</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {variant.referencePrice === null
                        ? "—"
                        : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                            variant.referencePrice
                          )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {primary ? (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs text-blue-700">
                            {primary.barcode}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin principal</span>
                        )}
                        {secondary.map((barcode) => (
                          <span key={barcode.id} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                            {barcode.barcode}
                          </span>
                        ))}
                        {canUpdate ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-700 hover:underline"
                            onClick={() => setBarcodeTarget(row)}
                          >
                            + código
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={variant.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canUpdate && variant.status !== "discontinued" ? (
                          <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setEditing(row);
                              setFormOpen(true);
                            }}
                          >
                            Editar
                          </button>
                        ) : null}
                        {variant.status === "discontinued" ? (
                          canManage ? (
                            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setRestoreTarget(row)}>
                              Restaurar
                            </Button>
                          ) : null
                        ) : canArchive ? (
                          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setArchiveTarget(row)}>
                            Archivar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VariantFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productId={productId}
        editing={editing}
        units={units}
        pending={pending}
        onSubmit={async (draft, status) => {
          const ok =
            editing === null
              ? await runAction(() => actions.create(draft), "Variante creada")
              : await runAction(
                  () => actions.update(editing.variant.id, draft, status),
                  "Variante actualizada"
                );
          if (ok) {
            setFormOpen(false);
          }
        }}
      />

      <BarcodeFormDialog
        open={barcodeTarget !== null}
        onClose={() => setBarcodeTarget(null)}
        row={barcodeTarget}
        pending={pending}
        onAdd={async (value, isPrimary) => {
          if (barcodeTarget !== null) {
            await runAction(
              () => actions.addBarcode(barcodeTarget.variant.id, value, isPrimary),
              "Código agregado"
            );
          }
        }}
        onChangePrimary={async (barcodeId) => {
          if (barcodeTarget !== null) {
            await runAction(
              () => actions.changePrimary(barcodeTarget.variant.id, barcodeId),
              "Código principal actualizado"
            );
          }
        }}
      />

      <ArchiveDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={async () => {
          await runAction(
            () => actions.archive(archiveTarget?.variant.id ?? ""),
            "Variante archivada"
          );
        }}
        title="Archivar variante"
        description={
          archiveTarget !== null
            ? `La variante “${archiveTarget.variant.sku}” pasará a estado Descontinuado.`
            : undefined
        }
        confirmLabel="Archivar"
        loading={pending}
      />
      <ArchiveDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={async () => {
          await runAction(
            () => actions.restore(restoreTarget?.variant.id ?? ""),
            "Variante restaurada"
          );
        }}
        title="Restaurar variante"
        description={
          restoreTarget !== null
            ? `La variante “${restoreTarget.variant.sku}” volverá a estar Activa.`
            : undefined
        }
        confirmLabel="Restaurar"
        loading={pending}
      />
    </div>
  );
}

function VariantFormDialog({
  open,
  onClose,
  productId,
  editing,
  units,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  editing: VariantRow | null;
  units: Unit[];
  pending: boolean;
  onSubmit: (draft: VariantDraft, status: "active" | "inactive") => Promise<void>;
}) {
  const isEdit = editing !== null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar variante · ${editing?.variant.sku ?? ""}` : "Nueva variante"}
      description={
        isEdit
          ? "Actualiza los datos de la presentación."
          : `Define una presentación para el producto (${productId.slice(0, 8)}…).`
      }
      size="lg"
    >
      {open ? (
        <VariantFormFields
          key={editing?.variant.id ?? "new"}
          editing={editing}
          units={units}
          pending={pending}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function VariantFormFields({
  editing,
  units,
  pending,
  onClose,
  onSubmit,
}: {
  editing: VariantRow | null;
  units: Unit[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (draft: VariantDraft, status: "active" | "inactive") => Promise<void>;
}) {
  const source = editing?.variant ?? null;
  const isEdit = editing !== null;
  const [sku, setSku] = useState(source?.sku ?? "");
  const [displayName, setDisplayName] = useState(source?.displayName ?? "");
  const [format, setFormat] = useState(source?.format ?? "");
  const [finish, setFinish] = useState(source?.finish ?? "");
  const [baseUnitId, setBaseUnitId] = useState(source?.baseUnitId ?? units[0]?.id ?? "");
  const [saleUnitId, setSaleUnitId] = useState(source?.saleUnitId ?? units[0]?.id ?? "");
  const [baseUnitsPerSaleUnit, setBaseUnitsPerSaleUnit] = useState(
    String(source?.baseUnitsPerSaleUnit ?? 1)
  );
  const [piecesPerBox, setPiecesPerBox] = useState(
    source === null || source.piecesPerBox === null ? "" : String(source.piecesPerBox)
  );
  const [squareMetersPerBox, setSquareMetersPerBox] = useState(
    source === null || source.squareMetersPerBox === null ? "" : String(source.squareMetersPerBox)
  );
  const [referencePrice, setReferencePrice] = useState(
    source === null || source.referencePrice === null ? "" : String(source.referencePrice)
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    source === null ? "active" : source.status === "inactive" ? "inactive" : "active"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (sku.trim() === "") nextErrors.sku = "El SKU es obligatorio";
    if (baseUnitId === "") nextErrors.baseUnitId = "Campo obligatorio";
    if (saleUnitId === "") nextErrors.saleUnitId = "Campo obligatorio";
    const conversion = Number(baseUnitsPerSaleUnit);
    if (!Number.isFinite(conversion) || conversion <= 0) nextErrors.baseUnitsPerSaleUnit = "Debe ser mayor a 0";
    const pieces = piecesPerBox === "" ? null : Number(piecesPerBox);
    if (pieces !== null && (!Number.isFinite(pieces) || pieces <= 0)) nextErrors.piecesPerBox = "Debe ser mayor a 0";
    const m2 = squareMetersPerBox === "" ? null : Number(squareMetersPerBox);
    if (m2 !== null && (!Number.isFinite(m2) || m2 <= 0)) nextErrors.squareMetersPerBox = "Debe ser mayor a 0";
    const price = referencePrice === "" ? null : Number(referencePrice);
    if (price !== null && (!Number.isFinite(price) || price < 0)) nextErrors.referencePrice = "Debe ser mayor o igual a 0";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit(
      {
        sku: sku.trim(),
        displayName: displayName.trim() === "" ? null : displayName.trim(),
        format: format.trim() === "" ? null : format.trim(),
        finish: finish.trim() === "" ? null : finish.trim(),
        baseUnitId,
        saleUnitId,
        baseUnitsPerSaleUnit: conversion,
        piecesPerBox: pieces,
        squareMetersPerBox: m2,
        referencePrice: price,
      },
      status
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="SKU" required error={errors.sku ?? null}>
          <Input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="Ej. TUB-PVC-100-PZA"
            invalid={Boolean(errors.sku)}
          />
        </Field>
        <Field label="Nombre de presentación">
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ej. Caja con 25 tubos" />
        </Field>
        <Field label="Formato">
          <Input value={format} onChange={(event) => setFormat(event.target.value)} placeholder='Ej. 1/2", 3/4"' />
        </Field>
        <Field label="Acabado">
          <Input value={finish} onChange={(event) => setFinish(event.target.value)} placeholder="Ej. Bronce, PVC" />
        </Field>
        <Field label="Unidad base" required error={errors.baseUnitId ?? null}>
          <Select value={baseUnitId} onChange={(event) => setBaseUnitId(event.target.value)}>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidad de venta" required error={errors.saleUnitId ?? null}>
          <Select value={saleUnitId} onChange={(event) => setSaleUnitId(event.target.value)}>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidades base por unidad de venta" required error={errors.baseUnitsPerSaleUnit ?? null}>
          <Input
            type="number"
            min={1}
            step="any"
            value={baseUnitsPerSaleUnit}
            onChange={(event) => setBaseUnitsPerSaleUnit(event.target.value)}
          />
        </Field>
        <Field label="Piezas por caja" error={errors.piecesPerBox ?? null}>
          <Input
            type="number"
            min={1}
            step="any"
            value={piecesPerBox}
            onChange={(event) => setPiecesPerBox(event.target.value)}
          />
        </Field>
        <Field label="m² por caja" error={errors.squareMetersPerBox ?? null}>
          <Input
            type="number"
            min={1}
            step="any"
            value={squareMetersPerBox}
            onChange={(event) => setSquareMetersPerBox(event.target.value)}
          />
        </Field>
        <Field label="Precio de referencia (MXN)" error={errors.referencePrice ?? null}>
          <Input
            type="number"
            min={0}
            step="any"
            value={referencePrice}
            onChange={(event) => setReferencePrice(event.target.value)}
          />
        </Field>
        {isEdit ? (
          <Field label="Estado">
            <Select value={status} onChange={(event) => setStatus(event.target.value as "active" | "inactive")}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </Select>
          </Field>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={pending}>
          {isEdit ? "Guardar cambios" : "Crear variante"}
        </Button>
      </div>
    </>
  );
}

function BarcodeFormDialog({
  open,
  onClose,
  row,
  pending,
  onAdd,
  onChangePrimary,
}: {
  open: boolean;
  onClose: () => void;
  row: VariantRow | null;
  pending: boolean;
  onAdd: (value: string, isPrimary: boolean) => Promise<void>;
  onChangePrimary: (barcodeId: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasPrimary = row !== null && row.barcodes.some((barcode) => barcode.isPrimary);

  async function handleAdd() {
    if (value.trim() === "") {
      setError("El código es obligatorio.");
      return;
    }
    setError(null);
    await onAdd(value.trim(), !hasPrimary);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Códigos de barras · ${row?.variant.sku ?? ""}`}
      description="Agrega códigos o cambia cuál es el principal."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cerrar
          </Button>
          <Button onClick={handleAdd} loading={pending}>
            Agregar código
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Field label="Nuevo código" error={error}>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ej. 7500000000090"
              invalid={Boolean(error)}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Códigos existentes</p>
          {row === null || row.barcodes.length === 0 ? (
            <p className="text-sm text-gray-400">Sin códigos registrados.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {row.barcodes.map((barcode) => (
                <li key={barcode.id} className="flex items-center justify-between px-3 py-2">
                  <span
                    className={
                      barcode.isPrimary
                        ? "font-mono text-sm font-semibold text-blue-700"
                        : "font-mono text-sm text-gray-600"
                    }
                  >
                    {barcode.barcode}
                    {barcode.isPrimary ? (
                      <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                        Principal
                      </span>
                    ) : null}
                  </span>
                  {!barcode.isPrimary && hasPrimary ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-700 hover:underline"
                      onClick={() => onChangePrimary(barcode.id)}
                    >
                      Hacer principal
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasPrimary ? (
          <p className="text-xs text-gray-400">
            El nuevo código se agregará como secundario; usa “Hacer principal” para reasignar el principal.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
