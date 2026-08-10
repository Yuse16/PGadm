"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LayoutNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/layout") {
      return pathname === "/admin/layout";
    }
    return pathname.startsWith(href);
  }

  const items = [{ href: "/admin/layout", label: "Layouts" }];

  return (
    <nav aria-label="Layout" className="mb-8 flex flex-wrap gap-2">
      {items.map((item) => {
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
