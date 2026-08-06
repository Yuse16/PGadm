import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "green" | "gray" | "amber" | "red" | "blue";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-600",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-800",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = "gray", dot = false, className, children, ...props }: BadgeProps) {
  const dotColor: Record<BadgeVariant, string> = {
    green: "bg-green-500",
    gray: "bg-gray-400",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[variant])} /> : null}
      {children}
    </span>
  );
}
