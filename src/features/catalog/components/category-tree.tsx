"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/features/catalog/domain";
import type { ActionResult } from "./action-results";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, Input, Select } from "./ui/input";
import { EmptyState } from "./ui/empty-state";
import { useToast } from "./ui/toast";

export interface CategoryDraftInput {
  parentId: string | null;
  code: string;
  name: string;
}

export interface CategoryChanges {
  code?: string;
  name?: string;
  parentId?: string | null;
  status?: "active" | "inactive";
}

export interface CategoryTreeProps {
  categories: Category[];
  canManage: boolean;
  actions: {
    create: (draft: CategoryDraftInput) => Promise<ActionResult<unknown>>;
    update: (id: string, changes: CategoryChanges) => Promise<ActionResult<unknown>>;
  };
}

interface TreeNode extends Category {
  depth: number;
  children: TreeNode[];
}

export function CategoryTree({ categories, canManage, actions }: CategoryTreeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.map((category) => category.id))
  );
  const [createParent, setCreateParent] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [pending, setPending] = useState(false);

  const tree = useMemo(() => buildTree(categories), [categories]);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Árbol de {categories.length} categoría{categories.length === 1 ? "" : "s"}
        </p>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setCreateParent(null);
              setCreateOpen(true);
            }}
          >
            <span aria-hidden>+</span> Nueva categoría raíz
          </Button>
        ) : null}
      </div>

      {tree.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Crea categorías para organizar los productos en un árbol de hasta 3 niveles."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categoría
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Código
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tree.map((node) => (
                <CategoryRow
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  canManage={canManage}
                  pending={pending}
                  onToggle={toggle}
                  onCreateChild={(parentId) => {
                    setCreateParent(parentId);
                    setCreateOpen(true);
                  }}
                  onEdit={(category) => setEditTarget(category)}
                  onToggleStatus={(category, target) =>
                    runAction(
                      () =>
                        actions.update(category.id, {
                          code: category.code,
                          name: category.name,
                          parentId: category.parentId,
                          status: target,
                        }),
                      target === "inactive" ? "Categoría desactivada" : "Categoría reactivada"
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage ? (
        <CategoryFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Nueva categoría"
          description="Agrega una categoría al árbol (máximo 3 niveles)."
          categories={categories}
          parentId={createParent}
          pending={pending}
          onSubmit={async (draft) => {
            const ok = await runAction(() => actions.create(draft), "Categoría creada");
            if (ok) {
              setCreateOpen(false);
            }
            return ok;
          }}
        />
      ) : null}

      {canManage && editTarget !== null ? (
        <CategoryFormDialog
          open
          onClose={() => setEditTarget(null)}
          title={`Editar categoría · ${editTarget.code}`}
          description="Actualiza los datos de la categoría."
          categories={categories}
          editing={editTarget}
          pending={pending}
          onSubmit={async (draft) => {
            const ok = await runAction(
              () =>
                actions.update(editTarget.id, {
                  code: draft.code,
                  name: draft.name,
                  parentId: draft.parentId,
                }),
              "Categoría actualizada"
            );
            if (ok) {
              setEditTarget(null);
            }
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}

function CategoryRow({
  node,
  expanded,
  canManage,
  pending,
  onToggle,
  onCreateChild,
  onEdit,
  onToggleStatus,
}: {
  node: TreeNode;
  expanded: Set<string>;
  canManage: boolean;
  pending: boolean;
  onToggle: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category, target: "active" | "inactive") => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3" style={{ paddingLeft: `${16 + node.depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                aria-label={isExpanded ? "Contraer" : "Expandir"}
                className="rounded text-gray-400 hover:text-gray-600"
              >
                <svg
                  aria-hidden
                  className={`h-4 w-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span aria-hidden className="w-4" />
            )}
            <span className="font-medium text-gray-900">{node.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-gray-600">{node.code}</td>
        <td className="px-4 py-3">
          <StatusBadge status={node.status} />
        </td>
        <td className="px-4 py-3">
          {canManage ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => onCreateChild(node.id)}>
                + Subcategoría
              </Button>
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => onEdit(node)}>
                Editar
              </Button>
              {node.status === "active" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onToggleStatus(node, "inactive")}
                >
                  Desactivar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onToggleStatus(node, "active")}
                >
                  Activar
                </Button>
              )}
            </div>
          ) : null}
        </td>
      </tr>
      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              expanded={expanded}
              canManage={canManage}
              pending={pending}
              onToggle={onToggle}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          ))
        : null}
    </>
  );
}

function CategoryFormDialog({
  open,
  onClose,
  title,
  description,
  categories,
  editing,
  parentId,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  categories: Category[];
  editing?: Category;
  parentId?: string | null;
  pending: boolean;
  onSubmit: (draft: CategoryDraftInput) => Promise<boolean>;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="sm">
      {open ? (
        <CategoryFormFields
          key={editing?.id ?? `new-${parentId ?? "root"}`}
          categories={categories}
          editing={editing}
          parentId={parentId}
          pending={pending}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function CategoryFormFields({
  categories,
  editing,
  parentId,
  pending,
  onClose,
  onSubmit,
}: {
  categories: Category[];
  editing?: Category;
  parentId?: string | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (draft: CategoryDraftInput) => Promise<boolean>;
}) {
  const isEdit = editing !== undefined;
  const initialParent =
    isEdit && editing !== undefined ? editing.parentId : parentId !== undefined ? parentId : null;
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [selectedParent, setSelectedParent] = useState(initialParent ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const options = useMemo(() => buildTree(categories).flat(), [categories]);

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (code.trim() === "") nextErrors.code = "El código es obligatorio";
    if (name.trim() === "") nextErrors.name = "El nombre es obligatorio";
    if (selectedParent === editing?.id) {
      nextErrors.parent = "Una categoría no puede ser su propio padre";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const ok = await onSubmit({
      parentId: selectedParent === "" ? null : selectedParent,
      code: code.trim(),
      name: name.trim(),
    });
    if (ok) {
      onClose();
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Categoría padre">
        <Select value={selectedParent} onChange={(event) => setSelectedParent(event.target.value)}>
          <option value="">— Raíz —</option>
          {options.map((category) => (
            <option key={category.id} value={category.id} disabled={category.id === editing?.id}>
              {"\u00A0".repeat(category.depth * 2)}
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      {errors.parent ? (
        <p role="alert" className="text-xs text-red-600">
          {errors.parent}
        </p>
      ) : null}
      <Field label="Código" required error={errors.code ?? null}>
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ej. TUB-PVC-PRES"
          invalid={Boolean(errors.code)}
        />
      </Field>
      <Field label="Nombre" required error={errors.name ?? null}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Tubería PVC de presión"
          invalid={Boolean(errors.name)}
        />
      </Field>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={pending}>
          {isEdit ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </div>
    </div>
  );
}

function buildTree(categories: Category[]): TreeNode[] {
  const childrenMap = new Map<string, TreeNode[]>();
  const nodes = new Map<string, TreeNode>();
  for (const category of categories) {
    const node: TreeNode = { ...category, depth: 0, children: [] };
    nodes.set(category.id, node);
  }
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId !== null && nodes.has(node.parentId)) {
      const siblings = childrenMap.get(node.parentId) ?? [];
      siblings.push(node);
      childrenMap.set(node.parentId, siblings);
    } else {
      roots.push(node);
    }
  }
  function assignDepth(node: TreeNode, depth: number) {
    node.depth = depth;
    node.children = childrenMap.get(node.id) ?? [];
    for (const child of node.children) {
      assignDepth(child, depth + 1);
    }
  }
  for (const root of roots) {
    assignDepth(root, 0);
  }
  return roots;
}
