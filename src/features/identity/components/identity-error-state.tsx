export interface IdentityErrorStateProps {
  title?: string;
  message?: string;
  /** Public-facing code only — never stack traces or internal payloads. */
  code?: string;
}

export function IdentityErrorState({
  title = "Error de identidad",
  message = "No se pudo completar la operación. Intenta de nuevo más tarde.",
  code,
}: IdentityErrorStateProps) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      aria-labelledby="identity-error-heading"
      className="mx-auto w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 text-center sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
        Error
      </p>
      <h1
        id="identity-error-heading"
        className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl"
      >
        {title}
      </h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      {code ? (
        <p className="mt-2 font-mono text-xs text-gray-400">Código: {code}</p>
      ) : null}
    </section>
  );
}
