import { createProductAction } from "@/features/catalog/server/actions";
import {
  flattenCategoriesWithDepth,
  requireCatalogSession,
} from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { ProductForm } from "@/features/catalog/components/product-form";
import { EmptyState } from "@/features/catalog/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const access = await requireCatalogSession();

  if (!access.permissions.canCreate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo producto" description="Crea un producto en el catálogo." />
        <EmptyState
          title="Sin permisos para crear productos"
          description="Contacta al administrador para solicitar el permiso catalog.create."
        />
      </div>
    );
  }

  const [brands, categories, lines] = await Promise.all([
    access.context.brandRepository.listBrands(access.organizationId),
    access.context.categoryRepository.listCategories(access.organizationId),
    access.context.productLineRepository.listProductLines(access.organizationId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nuevo producto"
        description="Define los datos generales del producto. El estado inicial es Inactivo."
      />
      <ProductForm
        mode="create"
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
        categories={flattenCategoriesWithDepth(categories)}
        lines={lines.map((line) => ({ id: line.id, name: line.name }))}
        onSubmit={createProductAction}
      />
    </div>
  );
}
