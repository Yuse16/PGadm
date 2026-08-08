import {
  createProductLineAction,
  updateProductLineAction,
} from "@/features/catalog/server/actions";
import { requireCatalogSession } from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ReferenceCrud } from "@/features/catalog/components/reference-crud";

export const dynamic = "force-dynamic";

export default async function CatalogLinesPage() {
  const access = await requireCatalogSession();
  const lines = await access.context.productLineRepository.listProductLines(
    access.organizationId
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Líneas de producto"
        description="Líneas de negocio para agrupar productos afines."
      />
      <ReferenceCrud
        entityLabel="línea"
        entityLabelPlural="líneas"
        fields={[
          { key: "primary", label: "Código externo", placeholder: "Ej. TUB" },
          { key: "name", label: "Nombre", required: true, placeholder: "Ej. Tubería y conexiones" },
        ]}
        items={lines.map((line) => ({
          id: line.id,
          primary: line.externalId ?? "",
          name: line.name,
          status: line.status,
        }))}
        canManage={access.permissions.canManage}
        actions={{
          create: (values) =>
            createProductLineAction({
              externalId: values.primary === "" ? null : values.primary,
              name: values.name,
            }),
          update: (id, changes) =>
            updateProductLineAction(id, {
              externalId: changes.primary === "" ? null : changes.primary,
              name: changes.name,
              status: changes.status,
            }),
        }}
      />
    </div>
  );
}
