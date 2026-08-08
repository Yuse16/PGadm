import type { ProductStatus, ReferenceStatus } from "@/features/catalog/domain";
import { Badge } from "./ui/badge";
import type { BadgeVariant } from "./ui/badge";

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  discontinued: "Descontinuado",
};

const REFERENCE_STATUS_LABELS: Record<ReferenceStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

function productVariant(status: ProductStatus): BadgeVariant {
  if (status === "active") return "green";
  if (status === "discontinued") return "red";
  return "gray";
}

export function StatusBadge({
  status,
}: {
  status: ProductStatus | ReferenceStatus;
}) {
  if (status === "active" || status === "inactive") {
    const variant = status === "active" ? "green" : "gray";
    return (
      <Badge variant={variant} dot>
        {REFERENCE_STATUS_LABELS[status]}
      </Badge>
    );
  }
  return (
    <Badge variant={productVariant(status)} dot>
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}
