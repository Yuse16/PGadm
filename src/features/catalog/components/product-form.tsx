"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductDraft } from "@/features/catalog/domain";
import type { ActionResult } from "./action-results";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Field, Input, Select, Textarea } from "./ui/input";
import { useToast } from "./ui/toast";

export interface ProductFormReference {
  id: string;
  name: string;
}

export interface ProductFormCategory extends ProductFormReference {
  depth: number;
}

export interface ProductFormProps {
  mode: "create" | "edit";
  initial?: ProductDraft;
  initialStatus?: "active" | "inactive";
  brands: ProductFormReference[];
  categories: ProductFormCategory[];
  lines: ProductFormReference[];
  onSubmit: (
    draft: ProductDraft,
    status?: "active" | "inactive"
  ) => Promise<ActionResult<Product>>;
}

export function ProductForm({
  mode,
  initial,
  initialStatus,
  brands,
  categories,
  lines,
  onSubmit,
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = mode === "edit";

  const [externalId, setExternalId] = useState(initial?.externalId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortName, setShortName] = useState(initial?.shortName ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [lineId, setLineId] = useState(initial?.lineId ?? "");
  const [technicalDescription, setTechnicalDescription] = useState(
    initial?.technicalDescription ?? ""
  );
  const [status, setStatus] = useState<"active" | "inactive">(initialStatus ?? "inactive");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (description.trim() === "") {
      nextErrors.description = "La descripción es obligatoria";
    }
    if (externalId !== "" && externalId !== externalId.trim()) {
      nextErrors.externalId = "No debe contener espacios al inicio o al final";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setError(null);
    try {
      const result = await onSubmit(
        {
          externalId: externalId.trim() === "" ? null : externalId.trim(),
          description: description.trim(),
          shortName: shortName.trim() === "" ? null : shortName.trim(),
          brandId: brandId === "" ? null : brandId,
          categoryId: categoryId === "" ? null : categoryId,
          lineId: lineId === "" ? null : lineId,
          technicalDescription:
            technicalDescription.trim() === "" ? null : technicalDescription.trim(),
        },
        status
      );
      if (result.ok) {
        toast({
          title: isEdit ? "Producto actualizado" : "Producto creado",
          variant: "success",
        });
        if (isEdit) {
          router.refresh();
        } else {
          router.push(`/admin/catalog/products/${result.entity.id}`);
        }
      } else {
        setError(result.error);
        toast({
          title: "No se pudo guardar el producto",
          description: result.error,
          variant: "error",
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Descripción"
            htmlFor="product-description"
            required
            hint="Nombre comercial del producto tal como se muestra en la venta."
            error={errors.description ?? null}
          >
            <Input
              id="product-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Tubo de PVC hidráulico de 1 pulgada, Cédula 40"
              invalid={Boolean(errors.description)}
            />
          </Field>
          <Field label="SKU externo" htmlFor="product-externalId" error={errors.externalId ?? null}>
            <Input
              id="product-externalId"
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              placeholder="Ej. TUB-PVC-100"
              invalid={Boolean(errors.externalId)}
            />
          </Field>
          <Field label="Nombre corto" htmlFor="product-shortName">
            <Input
              id="product-shortName"
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              placeholder={'Ej. Tubo PVC 1" CED 40'}
            />
          </Field>
          <Field label="Línea" htmlFor="product-line">
            <Select id="product-line" value={lineId} onChange={(event) => setLineId(event.target.value)}>
              <option value="">Sin línea</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marca" htmlFor="product-brand">
            <Select id="product-brand" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría" htmlFor="product-category">
            <Select id="product-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"\u00A0".repeat(category.depth * 2)}
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción técnica" htmlFor="product-technical">
              <Textarea
                id="product-technical"
                rows={3}
                value={technicalDescription}
                onChange={(event) => setTechnicalDescription(event.target.value)}
                placeholder="Especificaciones, material, normas…"
              />
            </Field>
          </div>
          {isEdit ? (
            <Field
              label="Estado"
              htmlFor="product-status"
              hint="Activar requiere al menos una variante activa."
            >
              <Select
                id="product-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as "active" | "inactive")}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </Select>
            </Field>
          ) : null}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={pending}>
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
