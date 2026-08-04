import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { IdentitySession } from "@/features/identity/domain";

vi.mock("server-only", () => ({}));

vi.mock("@/features/identity/application", () => {
  const session: IdentitySession = {
    user: {
      id: "30000000-0000-0000-0000-000000000001",
      email: "user.a@pgm.local",
      fullName: "Usuario A",
      status: "active",
    },
    organizationId: "10000000-0000-0000-0000-000000000001",
    organizationName: "Plomería García",
    branchId: "10000000-0000-0000-0000-000000000002",
    branchName: "Nogalera",
    roles: [
      {
        code: "manager",
        name: "Gerente",
        organizationId: "10000000-0000-0000-0000-000000000001",
        branchId: "10000000-0000-0000-0000-000000000002",
      },
    ],
    permissions: [
      { code: "organization.read", description: "Read own organization" },
    ],
    issuedAt: "2026-08-01T12:00:00.000Z",
    expiresAt: "2026-08-01T20:00:00.000Z",
  };

  return {
    requireIdentity: vi.fn(async () => session),
    requirePermission: vi.fn(),
    resolveIdentitySession: vi.fn(),
    getIdentitySession: vi.fn(),
  };
});

vi.mock("@/app/login/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("/admin/identity (real session page)", () => {
  it("renders the real session data", async () => {
    const { default: IdentityPage } = await import(
      "@/app/admin/identity/page"
    );
    render(await IdentityPage());

    expect(
      screen.getByText("Sesión real — datos resueltos desde la base de datos")
    ).toBeInTheDocument();
    expect(screen.getByText("Usuario A")).toBeInTheDocument();
    expect(
      screen.getAllByText("user.a@pgm.local").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Plomería García")).toBeInTheDocument();
    expect(screen.getByText("Nogalera")).toBeInTheDocument();
    expect(screen.getByText("Gerente")).toBeInTheDocument();
    expect(screen.getByText("organization.read")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" })
    ).toBeInTheDocument();
  });
});
