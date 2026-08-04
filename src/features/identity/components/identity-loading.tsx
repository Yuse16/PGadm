export interface IdentityLoadingProps {
  message?: string;
}

export function IdentityLoading({
  message = "Cargando información de identidad…",
}: IdentityLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-12"
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-700"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
