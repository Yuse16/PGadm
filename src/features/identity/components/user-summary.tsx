import type { AuthenticatedUser, IdentitySession } from "../domain";
import { RoleBadge } from "./role-badge";

export interface UserSummaryProps {
  user: AuthenticatedUser;
  session?: Pick<
    IdentitySession,
    "organizationName" | "branchName" | "roles"
  >;
}

export function UserSummary({ user, session }: UserSummaryProps) {
  const statusLabel = user.status === "active" ? "Activo" : "Inactivo";

  return (
    <section
      aria-labelledby="user-summary-heading"
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      <h2
        id="user-summary-heading"
        className="text-base font-semibold text-gray-900"
      >
        Usuario
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Nombre
          </dt>
          <dd className="mt-0.5 font-medium text-gray-900">
            {user.fullName ?? "Sin nombre"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Correo
          </dt>
          <dd className="mt-0.5 text-gray-700">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Estado
          </dt>
          <dd className="mt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  user.status === "active" ? "bg-green-500" : "bg-gray-400"
                }`}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </dd>
        </div>
        {session?.organizationName ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Organización / sucursal
            </dt>
            <dd className="mt-0.5 text-gray-700">
              {session.organizationName}
              {session.branchName ? ` · ${session.branchName}` : null}
            </dd>
          </div>
        ) : null}
        {session?.roles && session.roles.length > 0 ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Roles
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {session.roles.map((role) => (
                <RoleBadge key={`${role.code}-${role.branchId ?? "org"}`} role={role} />
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
