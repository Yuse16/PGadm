import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ToastProvider } from "@/features/catalog/components/ui/toast";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in demo mode");
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/identity/application", () => {
  return {
    requirePermission: vi.fn(async () => makeSession(ALL_PERMS)),
  };
});

const ORG_ID = "10000000-0000-0000-0000-000000000001";
const ALL_PERMS = [
  "catalog.read",
  "catalog.create",
  "catalog.update",
  "catalog.archive",
  "catalog.manage",
];

function makeSession(permissions: string[]) {
  return {
    user: {
      id: "30000000-0000-0000-0000-000000000001",
      email: "user.a@pgm.local",
      fullName: "Usuario A",
      status: "active" as const,
    },
    organizationId: ORG_ID,
    organizationName: "Plomería García",
    branchId: null,
    branchName: null,
    roles: [],
    permissions: permissions.map((code) => ({ code, description: null })),
    issuedAt: "2026-08-05T00:00:00.000Z",
    expiresAt: null,
  };
}

function renderCatalog(node: ReactNode) {
  return render(<ToastProvider>{node}</ToastProvider>);
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("Catalog admin pages (demo data source)", () => {
  it("renders the dashboard with stats and recent products", async () => {
    const pageModule = await import("@/app/admin/catalog/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getAllByText("Productos").length).toBeGreaterThan(0);
    expect(screen.getByText("Tubo de PVC hidráulico de 1 pulgada, Cédula 40")).toBeInTheDocument();
    expect(screen.getByText("Accesos rápidos")).toBeInTheDocument();
    expect(screen.getByText("Productos recientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nuevo producto" })).toBeInTheDocument();
  });

  it("renders the products list with demo rows", async () => {
    const pageModule = await import("@/app/admin/catalog/products/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Productos" })).toBeInTheDocument();
    expect(screen.getByText("Tubo de PVC hidráulico de 1 pulgada, Cédula 40")).toBeInTheDocument();
    expect(screen.getByText("Válvula de globo de bronce de 1/2 pulgada")).toBeInTheDocument();
    const createLinks = screen.getAllByRole("link", { name: "Nuevo producto" });
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks[0]).toHaveAttribute("href", "/admin/catalog/products/new");
  });

  it("hides the create button without the create permission", async () => {
    const identity = await import("@/features/identity/application");
    vi.mocked(identity.requirePermission).mockResolvedValueOnce(
      makeSession(["catalog.read"])
    );
    const pageModule = await import("@/app/admin/catalog/products/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Productos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nuevo producto" })).not.toBeInTheDocument();
  });

  it("renders the new product form for users with create permission", async () => {
    const pageModule = await import("@/app/admin/catalog/products/new/page");
    renderCatalog(await pageModule.default());

    expect(
      screen.getAllByRole("heading", { name: "Nuevo producto" }).length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Descripción\s*\*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre corto/)).toBeInTheDocument();
  });

  it("shows an empty state instead of the create form without permission", async () => {
    const identity = await import("@/features/identity/application");
    vi.mocked(identity.requirePermission).mockResolvedValueOnce(
      makeSession(["catalog.read"])
    );
    const pageModule = await import("@/app/admin/catalog/products/new/page");
    renderCatalog(await pageModule.default());

    expect(
      screen.getByText("Sin permisos para crear productos")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Descripción")).not.toBeInTheDocument();
  });

  it("renders a product detail with its variants and codes", async () => {
    const pageModule = await import("@/app/admin/catalog/products/[id]/page");
    const Page = pageModule.default;
    renderCatalog(
      await Page({
        params: Promise.resolve({
          id: "70000000-0000-0000-0000-000000000041",
        }),
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Tubo de PVC hidráulico de 1 pulgada, Cédula 40",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Información general")).toBeInTheDocument();
    expect(screen.getByText("Variantes y códigos")).toBeInTheDocument();
    expect(screen.getByText("TUB-PVC-100-PZA")).toBeInTheDocument();
    expect(screen.getByText("TUB-PVC-100-CJA")).toBeInTheDocument();
  });

  it("renders a not-found state for an unknown product id", async () => {
    const pageModule = await import("@/app/admin/catalog/products/[id]/page");
    const Page = pageModule.default;
    renderCatalog(
      await Page({
        params: Promise.resolve({
          id: "00000000-0000-0000-0000-00000000dead",
        }),
      })
    );

    expect(
      screen.getByRole("heading", { name: "Producto no encontrado" })
    ).toBeInTheDocument();
    expect(screen.getByText("No se encontró el producto")).toBeInTheDocument();
  });

  it("renders variants grouped by product", async () => {
    const pageModule = await import("@/app/admin/catalog/variants/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Variantes" })).toBeInTheDocument();
    expect(screen.getByText("TUB-PVC-100-PZA")).toBeInTheDocument();
    expect(screen.getByText("TUB-PVC-100-CJA")).toBeInTheDocument();
  });

  it("renders the category tree", async () => {
    const pageModule = await import("@/app/admin/catalog/categories/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Categorías" })).toBeInTheDocument();
    expect(screen.getByText("Tubería")).toBeInTheDocument();
    expect(screen.getByText("Tubería PVC")).toBeInTheDocument();
  });

  it("renders the brands reference list", async () => {
    const pageModule = await import("@/app/admin/catalog/brands/page");
    renderCatalog(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Marcas" })).toBeInTheDocument();
    expect(screen.getByText("Marca Demo A")).toBeInTheDocument();
    expect(screen.getByText("Marca Demo B")).toBeInTheDocument();
  });

  it("renders the product lines reference list", async () => {
    const pageModule = await import("@/app/admin/catalog/lines/page");
    renderCatalog(await pageModule.default());

    expect(
      screen.getByRole("heading", { name: "Líneas de producto" })
    ).toBeInTheDocument();
    expect(screen.getByText("Tubería y conexiones")).toBeInTheDocument();
    expect(screen.getByText("Válvulas y llaves")).toBeInTheDocument();
  });

  it("renders the units of measure list", async () => {
    const pageModule = await import("@/app/admin/catalog/units/page");
    renderCatalog(await pageModule.default());

    expect(
      screen.getByRole("heading", { name: "Unidades de medida" })
    ).toBeInTheDocument();
    expect(screen.getByText("Pieza")).toBeInTheDocument();
    expect(screen.getByText("Metro")).toBeInTheDocument();
  });

  it("renders a loading state with a live region", async () => {
    const { default: CatalogLoading } = await import(
      "@/app/admin/catalog/loading"
    );
    render(<CatalogLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Cargando catálogo…")).toBeInTheDocument();
  });
});
