"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
      <h1 className="text-4xl font-bold text-red-600">Error</h1>
      <p className="text-gray-600">
        Ocurrió un error inesperado. Intenta de nuevo.
      </p>
      {isDev && (
        <p className="text-sm text-gray-400">{error.message}</p>
      )}
      <button
        onClick={reset}
        className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
