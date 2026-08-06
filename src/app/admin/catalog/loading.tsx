import { LoadingState } from "@/features/catalog/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      <LoadingState label="Cargando catálogo…" rows={5} />
    </div>
  );
}
