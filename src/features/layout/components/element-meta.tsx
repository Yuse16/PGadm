import type { LayoutElement, LayoutElementType } from "@/features/layout/domain";
import { Badge } from "./ui/badge";
import type { BadgeVariant } from "./ui/badge";

export const ELEMENT_TYPE_LABELS: Record<LayoutElementType, string> = {
  m1: "M1",
  galeria: "Galería",
  muro: "Muro",
  escaleras: "Escaleras",
  vanity: "Vanity",
  banos: "Baños",
  griferia: "Grifería",
  jacuzzi: "Jacuzzi",
  boiler: "Boiler",
  parrillas: "Parrillas",
  mallas_fachaletas: "Mallas y fachaletas",
  adhesivos: "Adhesivos",
  ambiente: "Ambiente",
  mostrador: "Mostrador",
  caja: "Caja",
  zona: "Zona",
  otro: "Otro",
};

const ELEMENT_TYPE_VARIANTS: Record<LayoutElementType, BadgeVariant> = {
  m1: "blue",
  galeria: "green",
  muro: "amber",
  escaleras: "amber",
  vanity: "blue",
  banos: "blue",
  griferia: "green",
  jacuzzi: "green",
  boiler: "amber",
  parrillas: "amber",
  mallas_fachaletas: "green",
  adhesivos: "green",
  ambiente: "gray",
  mostrador: "red",
  caja: "red",
  zona: "gray",
  otro: "gray",
};

export function ElementTypeBadge({ elementType }: { elementType: LayoutElementType }) {
  return <Badge variant={ELEMENT_TYPE_VARIANTS[elementType]}>{ELEMENT_TYPE_LABELS[elementType]}</Badge>;
}

/** True when the element is hidden via `metadata.hidden` (LAYOUT_EDITING_RULES). */
export function isElementHidden(element: LayoutElement): boolean {
  return element.metadata?.hidden === true;
}

/** M1 rail capacity recommendation from `metadata.capacidad_riel` (D-L08, no hardcoded CHECK). */
export function m1RielCapacities(element: LayoutElement): { frontal: number; intermedio: number; posterior: number } | null {
  const capacity = element.metadata?.capacidad_riel;
  if (typeof capacity !== "object" || capacity === null) {
    return null;
  }
  const entry = capacity as { frontal?: unknown; intermedio?: unknown; posterior?: unknown };
  if (
    typeof entry.frontal !== "number" ||
    typeof entry.intermedio !== "number" ||
    typeof entry.posterior !== "number"
  ) {
    return null;
  }
  return { frontal: entry.frontal, intermedio: entry.intermedio, posterior: entry.posterior };
}

export function ElementPositionStyle(element: LayoutElement) {
  return {
    left: `${element.x * 100}%`,
    top: `${element.y * 100}%`,
    width: `${element.width * 100}%`,
    height: `${element.height * 100}%`,
    transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
    zIndex: element.zIndex,
  } as const;
}
