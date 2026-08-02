import Link from "next/link";

export interface AccessDeniedProps {
  message?: string;
  homeHref?: string;
}

export function AccessDenied({
  message = "No tienes permiso para acceder a este recurso.",
  homeHref = "/",
}: AccessDeniedProps) {
  return (
    <section
      role="alert"
      aria-labelledby="access-denied-heading"
      className="mx-auto w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 text-center sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
        Acceso denegado
      </p>
      <h1
        id="access-denied-heading"
        className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl"
      >
        No autorizado
      </h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <Link
        href={homeHref}
        className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
