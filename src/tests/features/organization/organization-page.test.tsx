import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in demo mode");
  }),
}));

vi.mock("@/features/identity/application", () => ({
  requirePermission: vi.fn(async () => ({
    user: {
      id: "30000000-0000-0000-0000-000000000001",
      email: "user.a@pgm.local",
      fullName: "Usuario A",
      status: "active",
    },
    organizationId: "10000000-0000-0000-0000-000000000001",
    organizationName: "Plomería García",
    branchId: null,
    branchName: null,
    roles: [],
    permissions: [{ code: "organization.read", description: null }],
    issuedAt: "2026-08-01T12:00:00.000Z",
    expiresAt: null,
  })),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Organization admin page (demo data source)", () => {
  it("renders the section header", async () => {
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Organización" })
    ).toBeInTheDocument();
  });

  it("renders the demo organization data without a database", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());

    expect(screen.getByText("Plomería García")).toBeInTheDocument();
    expect(screen.getByText("Nogalera")).toBeInTheDocument();
    expect(screen.getByText(/116NOG-PGM/)).toBeInTheDocument();
    expect(screen.getByText("CEDIS Saltillo")).toBeInTheDocument();
    expect(screen.getByText(/106SAL-PGM/)).toBeInTheDocument();
    expect(screen.getByText(/NOG-01/)).toBeInTheDocument();
    expect(screen.getByText(/SAL-01/)).toBeInTheDocument();
  });

  it("labels the data source as demo data", async () => {
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());
    expect(
      screen.getByText(/Fuente de datos: Datos demo locales/)
    ).toBeInTheDocument();
  });

  it("links back to home", async () => {
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());
    expect(screen.getByRole("link", { name: "← Inicio" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders a loading state with a live region", async () => {
    const { default: OrganizationLoading } = await import(
      "@/app/admin/organization/loading"
    );
    render(<OrganizationLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(
      screen.getByText("Cargando estructura de la organización…")
    ).toBeInTheDocument();
  });
});
