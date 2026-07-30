import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          PGadm
        </h1>
        <p className="text-xl text-gray-600">
          Plomería García — PWA de gestión multi-sucursal
        </p>

        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Fundación técnica activa
        </div>

        <p className="text-sm text-gray-400">v0.1.0 — Fase 1A</p>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/health"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Health Check
          </Link>
        </div>
      </div>
    </div>
  );
}
