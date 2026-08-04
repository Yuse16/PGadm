import Link from "next/link";
import {
  PermissionSummary,
  SessionStatus,
  UserSummary,
} from "@/features/identity/components";
import type { SessionState } from "@/features/identity/domain";
import { requireIdentity } from "@/features/identity/application";
import { logoutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function IdentityPage() {
  const session = await requireIdentity();

  const state: SessionState = { status: "authenticated", session };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Inicio
        </Link>
      </nav>

      <header className="mb-8 space-y-2">
        <p
          role="status"
          aria-live="polite"
          className="inline-flex rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800"
        >
          Sesión real — datos resueltos desde la base de datos
        </p>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Identidad
        </h1>
        <p className="text-sm text-gray-500">
          Sesión autenticada y permisos efectivos del usuario actual.
        </p>
      </header>

      <div className="space-y-8">
        <SessionStatus state={state} />

        <div className="grid gap-4 md:grid-cols-2">
          <UserSummary
            user={session.user}
            session={{
              organizationName: session.organizationName,
              branchName: session.branchName,
              roles: session.roles,
            }}
          />
          <PermissionSummary permissions={session.permissions} />
        </div>

        <section
          aria-labelledby="session-meta-heading"
          className="rounded-lg border border-gray-200 bg-white p-5"
        >
          <h2
            id="session-meta-heading"
            className="text-base font-semibold text-gray-900"
          >
            Sesión
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Inicio
              </dt>
              <dd className="mt-0.5 text-gray-700">
                {new Date(session.issuedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Expiración
              </dt>
              <dd className="mt-0.5 text-gray-700">
                {session.expiresAt
                  ? new Date(session.expiresAt).toLocaleString()
                  : "Sin expiración"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Organización
              </dt>
              <dd className="mt-0.5 text-gray-700">
                {session.organizationName ?? "Sin organización asignada"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Sucursal
              </dt>
              <dd className="mt-0.5 text-gray-700">
                {session.branchName ?? "Sin sucursal asignada"}
              </dd>
            </div>
          </dl>
        </section>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
