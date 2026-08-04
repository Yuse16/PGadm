import Link from "next/link";

export interface SessionExpiredProps {
  message?: string;
  loginHref?: string;
}

export function SessionExpired({
  message = "Tu sesión ha vencido. Vuelve a iniciar sesión para continuar.",
  loginHref = "/login",
}: SessionExpiredProps) {
  return (
    <section
      role="status"
      aria-labelledby="session-expired-heading"
      className="mx-auto w-full max-w-lg rounded-lg border border-amber-200 bg-white p-6 text-center sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Sesión vencida
      </p>
      <h1
        id="session-expired-heading"
        className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl"
      >
        Sesión expirada
      </h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <Link
        href={loginHref}
        className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Iniciar sesión de nuevo
      </Link>
    </section>
  );
}
