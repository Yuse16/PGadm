import Link from "next/link";
import type { ReactNode } from "react";
import { CatalogNav } from "@/features/catalog/components/catalog-nav";
import { ToastProvider } from "@/features/catalog/components/ui/toast";

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Inicio
          </Link>
          <span className="mx-2 text-gray-300" aria-hidden>
            /
          </span>
          <span className="text-sm text-gray-500">Catálogo</span>
        </nav>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">Catálogo de productos</h1>
        <p className="mb-8 text-sm text-gray-500">
          Productos, variantes, códigos y referencias · Fase 1C.4
        </p>
        <CatalogNav />
        {children}
      </div>
    </ToastProvider>
  );
}
