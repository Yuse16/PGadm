export default function OrganizationLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12" role="status" aria-live="polite">
      <div className="mb-8 h-6 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-8">
        <div className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        </div>
      </div>
      <span className="sr-only">Cargando estructura de la organización…</span>
    </div>
  );
}
