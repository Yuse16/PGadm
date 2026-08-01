import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called without configuration");
  }),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Organization admin page", () => {
  it("renders the section header", async () => {
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Organización" })
    ).toBeInTheDocument();
  });

  it("shows a safe state when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const pageModule = await import("@/app/admin/organization/page");
    const Page = pageModule.default;
    render(await Page());
    expect(
      screen.getByText("Base de datos no configurada")
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
