import Link from "next/link";

export interface InactiveAccountProps {
  message?: string;
  loginHref?: string;
}

export function InactiveAccount({
  message = "Tu cuenta está inactiva. Contacta al administrador para reactivarla.",
  loginHref = "/login",
}: InactiveAccountProps) {
  return (
    <section
      role="status"
      aria-labelledby="inactive-account-heading"
      className="mx-auto w-full max-w-lg rounded-lg border border-orange-200 bg-white p-6 text-center sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
        Cuenta inactiva
      </p>
      <h1
        id="inactive-account-heading"
        className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl"
      >
        Acceso suspendido
      </h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <Link
        href={loginHref}
        className="mt-6 inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Ir al inicio de sesión
      </Link>
    </section>
  );
}
