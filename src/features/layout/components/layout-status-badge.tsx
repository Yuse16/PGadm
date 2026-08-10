import type { LayoutReviewStatus, LayoutStatus } from "@/features/layout/domain";
import { Badge } from "./ui/badge";
import type { BadgeVariant } from "./ui/badge";

const LAYOUT_STATUS_LABELS: Record<LayoutStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

function layoutStatusVariant(status: LayoutStatus): BadgeVariant {
  if (status === "published") return "green";
  if (status === "archived") return "gray";
  return "amber";
}

const REVIEW_STATUS_LABELS: Record<LayoutReviewStatus, string> = {
  ok: "En orden",
  needs_review: "Revisar",
};

function reviewStatusVariant(status: LayoutReviewStatus): BadgeVariant {
  return status === "needs_review" ? "red" : "green";
}

export function LayoutStatusBadge({ status }: { status: LayoutStatus }) {
  return (
    <Badge variant={layoutStatusVariant(status)} dot>
      {LAYOUT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ReviewStatusBadge({ status }: { status: LayoutReviewStatus }) {
  return (
    <Badge variant={reviewStatusVariant(status)} dot>
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}
