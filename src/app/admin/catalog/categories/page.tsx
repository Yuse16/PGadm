import { createCategoryAction, updateCategoryAction } from "@/features/catalog/server/actions";
import { requireCatalogSession } from "@/features/catalog/server";
import { PageHeader } from "@/features/catalog/components/page-header";
import { CategoryTree } from "@/features/catalog/components/category-tree";

export const dynamic = "force-dynamic";

export default async function CatalogCategoriesPage() {
  const access = await requireCatalogSession();
  const categories = await access.context.categoryRepository.listCategories(
    access.organizationId
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Árbol jerárquico de hasta 3 niveles para clasificar productos."
      />
      <CategoryTree
        categories={categories}
        canManage={access.permissions.canManage}
        actions={{
          create: createCategoryAction,
          update: updateCategoryAction,
        }}
      />
    </div>
  );
}
