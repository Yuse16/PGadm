"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "./action-results";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, Input, Select } from "./ui/input";
import { EmptyState } from "./ui/empty-state";
import { SearchInput } from "./ui/search-input";
import { useToast } from "./ui/toast";

export interface ReferenceItem {
  id: string;
  primary: string;
  name: string;
  secondary?: string | null;
  status: "active" | "inactive";
}

export interface ReferenceFormValues {
  primary: string;
  name: string;
  kind?: string;
}

export interface ReferenceChanges extends ReferenceFormValues {
  status?: "active" | "inactive";
}

export interface ReferenceFormField {
  key: "primary" | "name" | "kind";
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  kindOptions?: Array<{ value: string; label: string }>;
}

export interface ReferenceCrudProps {
  entityLabel: string;
  entityLabelPlural: string;
  fields: ReferenceFormField[];
  items: ReferenceItem[];
  canManage: boolean;
  actions: {
    create: (values: ReferenceFormValues) => Promise<ActionResult<unknown>>;
    update: (id: string, changes: ReferenceChanges) => Promise<ActionResult<unknown>>;
  };
}

export function ReferenceCrud({
  entityLabel,
  entityLabelPlural,
  fields,
  items,
  canManage,
  actions,
}: ReferenceCrudProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReferenceItem | null>(null);
  const [pending, setPending] = useState(false);

  const kindField = fields.find((field) => field.key === "kind");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") return items;
    return items.filter(
      (item) =>
        item.primary.toLowerCase().includes(needle) ||
        item.name.toLowerCase().includes(needle) ||
        (item.secondary ?? "").toLowerCase().includes(needle)
    );
  }, [items, query]);

  async function runAction(
    action: () => Promise<ActionResult<unknown>>,
    successTitle: string
  ): Promise<boolean> {
    setPending(true);
    try {
      const result = await action();
      if (result.ok) {
        toast({ title: successTitle, variant: "success" });
        router.refresh();
        return true;
      }
      toast({
        title: "No se pudo completar la acción",
        description: result.error,
        variant: "error",
      });
      return false;
    } finally {
      setPending(false);
    }
  }

  const tableFields =
    kindField !== undefined ? fields : fields.filter((field) => field.key !== "kind");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          placeholder={`Buscar por código o nombre…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full md:w-72"
        />
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <span aria-hidden>+</span> Nueva {entityLabel}
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={query !== "" ? "Sin resultados" : `Aún no hay ${entityLabelPlural}`}
          description={
            query !== ""
              ? "Ajusta la búsqueda."
              : `Crea la primera ${entityLabel} para usarla en los productos.`
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {tableFields.map((field) => (
                  <th
                    key={field.key}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.primary}</td>
                  <td className="px-4 py-3 text-gray-700">{item.name}</td>
                  {kindField ? (
                    <td className="px-4 py-3 text-xs text-gray-600">{item.secondary ?? "—"}</td>
                  ) : null}
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setEditing(item);
                            setFormOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        {item.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              runAction(
                                () => actions.update(item.id, { primary: item.primary, name: item.name, status: "inactive" }),
                                `${capitalize(entityLabel)} desactivada`
                              )
                            }
                          >
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              runAction(
                                () => actions.update(item.id, { primary: item.primary, name: item.name, status: "active" }),
                                `${capitalize(entityLabel)} reactivada`
                              )
                            }
                          >
                            Activar
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage ? (
        <ReferenceFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          entityLabel={entityLabel}
          fields={fields}
          editing={editing}
          pending={pending}
          onSubmit={async (values) => {
            const ok =
              editing === null
                ? await runAction(
                    () => actions.create(values),
                    `${capitalize(entityLabel)} creada`
                  )
                : await runAction(
                    () => actions.update(editing.id, { ...values }),
                    `${capitalize(entityLabel)} actualizada`
                  );
            if (ok) {
              setFormOpen(false);
            }
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}

function ReferenceFormDialog({
  open,
  onClose,
  entityLabel,
  fields,
  editing,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  entityLabel: string;
  fields: ReferenceFormField[];
  editing: ReferenceItem | null;
  pending: boolean;
  onSubmit: (values: ReferenceFormValues) => Promise<boolean>;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing !== null ? `Editar ${entityLabel} · ${editing.primary}` : `Nueva ${entityLabel}`}
      description={editing !== null ? "Actualiza los datos del registro." : "Registra un nuevo elemento del catálogo."}
      size="sm"
    >
      {open ? (
        <ReferenceFormFields
          key={editing?.id ?? "new"}
          fields={fields}
          editing={editing}
          pending={pending}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function ReferenceFormFields({
  fields,
  editing,
  pending,
  onClose,
  onSubmit,
}: {
  fields: ReferenceFormField[];
  editing: ReferenceItem | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: ReferenceFormValues) => Promise<boolean>;
}) {
  const primaryField = fields.find((field) => field.key === "primary");
  const nameField = fields.find((field) => field.key === "name");
  const kindField = fields.find((field) => field.key === "kind");

  const [primary, setPrimary] = useState(editing?.primary ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [kind, setKind] = useState(kindField?.kindOptions?.[0]?.value ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (primaryField?.required && primary.trim() === "") {
      nextErrors.primary = `${primaryField.label} es obligatorio`;
    }
    if (nameField?.required && name.trim() === "") {
      nextErrors.name = `${nameField.label} es obligatorio`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const ok = await onSubmit({
      primary: primary.trim(),
      name: name.trim(),
      kind: kind === "" ? undefined : kind,
    });
    if (ok) {
      onClose();
    }
  }

  return (
    <div className="space-y-4">
      {primaryField ? (
        <Field
          label={primaryField.label}
          required={primaryField.required}
          hint={primaryField.hint ?? null}
          error={errors.primary ?? null}
        >
          <Input
            value={primary}
            onChange={(event) => setPrimary(event.target.value)}
            placeholder={primaryField.placeholder}
            invalid={Boolean(errors.primary)}
          />
        </Field>
      ) : null}
      {nameField ? (
        <Field
          label={nameField.label}
          required={nameField.required}
          hint={nameField.hint ?? null}
          error={errors.name ?? null}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={nameField.placeholder}
            invalid={Boolean(errors.name)}
          />
        </Field>
      ) : null}
      {kindField ? (
        <Field label={kindField.label} required={kindField.required}>
          <Select value={kind} onChange={(event) => setKind(event.target.value)}>
            {kindField.kindOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={pending}>
          {editing !== null ? "Guardar cambios" : "Crear"}
        </Button>
      </div>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
