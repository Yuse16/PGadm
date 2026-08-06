"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/catalog", label: "Resumen" },
  { href: "/admin/catalog/products", label: "Productos" },
  { href: "/admin/catalog/variants", label: "Variantes" },
  { href: "/admin/catalog/categories", label: "Categorías" },
  { href: "/admin/catalog/brands", label: "Marcas" },
  { href: "/admin/catalog/lines", label: "Líneas" },
  { href: "/admin/catalog/units", label: "Unidades" },
];

export function CatalogNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/catalog") {
      return pathname === "/admin/catalog";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav aria-label="Catálogo" className="mb-8 flex flex-wrap gap-2">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
              active
                ? "bg-blue-700 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
