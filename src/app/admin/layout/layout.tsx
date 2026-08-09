import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutNav } from "@/features/layout/components/layout-nav";
import { ToastProvider } from "@/features/layout/components/ui/toast";

export default function LayoutAdminLayout({ children }: { children: ReactNode }) {
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
          <span className="text-sm text-gray-500">Layout</span>
        </nav>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">Layout</h1>
        <p className="mb-8 text-sm text-gray-500">
          Plano estructurado, muebles y posiciones · Fase 3
        </p>
        <LayoutNav />
        {children}
      </div>
    </ToastProvider>
  );
}
