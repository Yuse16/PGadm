import type { ReactNode } from "react";
import {
  AccessDenied,
  IdentityErrorState,
  IdentityLoading,
  InactiveAccount,
  PermissionSummary,
  SessionExpired,
  SessionStatus,
  UserSummary,
} from "@/features/identity/components";
import type {
  IdentitySession,
  SessionState,
} from "@/features/identity/domain";

/** Preview-only mocks — never used for real authorization. */
const PREVIEW_SESSION: IdentitySession = {
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    email: "usuario@example.test",
    fullName: "Usuario de prueba",
    status: "active",
  },
  organizationId: "00000000-0000-4000-8000-000000000010",
  organizationName: "Plomería García",
  branchId: "00000000-0000-4000-8000-000000000020",
  branchName: "Nogalera",
  roles: [
    {
      code: "branch_admin",
      name: "Administrador de sucursal",
      organizationId: "00000000-0000-4000-8000-000000000010",
      branchId: "00000000-0000-4000-8000-000000000020",
    },
  ],
  permissions: [
    {
      code: "inventory.read",
      description: "Consultar inventario de la sucursal",
    },
    {
      code: "orders.write",
      description: "Crear y editar pedidos",
    },
  ],
  issuedAt: "2026-08-01T12:00:00.000Z",
  expiresAt: "2026-08-01T20:00:00.000Z",
};

const AUTHENTICATED_STATE: SessionState = {
  status: "authenticated",
  session: PREVIEW_SESSION,
};

export default function IdentityPreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 space-y-2">
        <p
          role="status"
          aria-live="polite"
          className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900"
        >
          Vista previa de identidad — datos simulados
        </p>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Identidad (vista previa)
        </h1>
        <p className="text-sm text-gray-500">
          Componentes visuales con datos genéricos. Sin autenticación real.
        </p>
      </header>

      <div className="space-y-10">
        <PreviewSection title="1. Usuario autenticado">
          <div className="space-y-4">
            <SessionStatus state={AUTHENTICATED_STATE} />
            <div className="grid gap-4 md:grid-cols-2">
              <UserSummary
                user={PREVIEW_SESSION.user}
                session={PREVIEW_SESSION}
              />
              <PermissionSummary permissions={PREVIEW_SESSION.permissions} />
            </div>
          </div>
        </PreviewSection>

        <PreviewSection title="2. Cuenta inactiva">
          <InactiveAccount message="La cuenta de Usuario de prueba está inactiva en Nogalera." />
        </PreviewSection>

        <PreviewSection title="3. Sesión vencida">
          <SessionExpired message="La sesión de usuario@example.test ha vencido." />
        </PreviewSection>

        <PreviewSection title="4. Acceso denegado">
          <AccessDenied message="Usuario de prueba no tiene permiso para este módulo." />
        </PreviewSection>

        <PreviewSection title="5. Error">
          <IdentityErrorState
            title="No se pudo cargar la sesión"
            message="Error simulado de identidad. Sin datos internos."
            code="IDENTITY_PREVIEW_ERROR"
          />
        </PreviewSection>

        <PreviewSection title="6. Loading">
          <IdentityLoading message="Cargando sesión simulada…" />
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
