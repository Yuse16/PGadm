export default function LoadingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <div className="inline-flex items-center gap-2 text-gray-400">
        <svg
          className="h-5 w-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Cargando PGadm…</span>
      </div>
    </div>
  );
}
