import { createBrandAction, updateBrandAction } from "@/features/catalog/server/actions";
import { requireCatalogSession } from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ReferenceCrud } from "@/features/catalog/components/reference-crud";

export const dynamic = "force-dynamic";

export default async function CatalogBrandsPage() {
  const access = await requireCatalogSession();
  const brands = await access.context.brandRepository.listBrands(access.organizationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marcas"
        description="Marcas disponibles para asignar a los productos."
      />
      <ReferenceCrud
        entityLabel="marca"
        entityLabelPlural="marcas"
        fields={[
          { key: "primary", label: "Código", required: true, placeholder: "Ej. MD-A" },
          { key: "name", label: "Nombre", required: true, placeholder: "Ej. Marca Demo A" },
        ]}
        items={brands.map((brand) => ({
          id: brand.id,
          primary: brand.code,
          name: brand.name,
          status: brand.status,
        }))}
        canManage={access.permissions.canManage}
        actions={{
          create: (values) => createBrandAction({ code: values.primary, name: values.name }),
          update: (id, changes) =>
            updateBrandAction(id, {
              code: changes.primary,
              name: changes.name,
              status: changes.status,
            }),
        }}
      />
    </div>
  );
}
