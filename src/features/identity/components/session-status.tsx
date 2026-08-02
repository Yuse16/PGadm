import type { SessionState } from "../domain";

const STATUS_LABELS: Record<SessionState["status"], string> = {
  loading: "Cargando sesión",
  unauthenticated: "Sin autenticar",
  authenticated: "Autenticado",
  expired: "Sesión vencida",
  inactive: "Cuenta inactiva",
  forbidden: "Acceso denegado",
  error: "Error de sesión",
};

const STATUS_STYLES: Record<SessionState["status"], string> = {
  loading: "bg-gray-100 text-gray-700 border-gray-200",
  unauthenticated: "bg-gray-50 text-gray-600 border-gray-200",
  authenticated: "bg-green-50 text-green-800 border-green-200",
  expired: "bg-amber-50 text-amber-800 border-amber-200",
  inactive: "bg-orange-50 text-orange-800 border-orange-200",
  forbidden: "bg-red-50 text-red-800 border-red-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export interface SessionStatusProps {
  state: SessionState;
}

export function SessionStatus({ state }: SessionStatusProps) {
  const detail =
    state.status === "authenticated"
      ? state.session.user.email
      : state.status === "error"
        ? state.error.message
        : state.status === "expired" ||
            state.status === "inactive" ||
            state.status === "forbidden"
          ? state.message
          : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-md border px-3 py-2 text-sm ${STATUS_STYLES[state.status]}`}
    >
      <p className="font-medium">{STATUS_LABELS[state.status]}</p>
      {detail ? <p className="mt-0.5 text-xs opacity-90">{detail}</p> : null}
    </div>
  );
}
