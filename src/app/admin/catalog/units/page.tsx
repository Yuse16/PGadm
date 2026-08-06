import { createUnitAction, updateUnitAction } from "@/features/catalog/server/actions";
import { requireCatalogSession } from "@/features/catalog/server";
import type { UnitKind } from "@/features/catalog/domain";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ReferenceCrud } from "@/features/catalog/components/reference-crud";

export const dynamic = "force-dynamic";

const KIND_OPTIONS: Array<{ value: UnitKind; label: string }> = [
  { value: "count", label: "Conteo" },
  { value: "length", label: "Longitud" },
  { value: "area", label: "Área" },
  { value: "volume", label: "Volumen" },
  { value: "mass", label: "Masa" },
  { value: "package", label: "Paquete" },
];

const KIND_LABELS: Record<UnitKind, string> = {
  count: "Conteo",
  length: "Longitud",
  area: "Área",
  volume: "Volumen",
  mass: "Masa",
  package: "Paquete",
};

export default async function CatalogUnitsPage() {
  const access = await requireCatalogSession();
  const units = await access.context.unitRepository.listUnits(access.organizationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades de medida"
        description="Unidades base y de venta usadas por las variantes."
      />
      <ReferenceCrud
        entityLabel="unidad"
        entityLabelPlural="unidades"
        fields={[
          { key: "primary", label: "Código", required: true, placeholder: "Ej. PZA" },
          { key: "name", label: "Nombre", required: true, placeholder: "Ej. Pieza" },
          { key: "kind", label: "Tipo", required: true, kindOptions: KIND_OPTIONS },
        ]}
        items={units.map((unit) => ({
          id: unit.id,
          primary: unit.code,
          name: unit.name,
          secondary: KIND_LABELS[unit.kind],
          status: unit.status,
        }))}
        canManage={access.permissions.canManage}
        actions={{
          create: (values) =>
            createUnitAction({
              code: values.primary,
              name: values.name,
              kind: (values.kind ?? "count") as UnitKind,
            }),
          update: (id, changes) =>
            updateUnitAction(id, {
              code: changes.primary,
              name: changes.name,
              kind: changes.kind === undefined ? undefined : (changes.kind as UnitKind),
              status: changes.status,
            }),
        }}
      />
    </div>
  );
}
