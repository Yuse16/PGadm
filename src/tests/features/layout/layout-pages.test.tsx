import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ToastProvider } from "@/features/layout/components/ui/toast";

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
  "layout.read",
  "layout.edit",
  "layout.publish",
  "layout.manage",
];

const DEMO_LAYOUT_ID = "A0000000-0000-0000-0000-000000000001";

function makeSession(permissions: string[]) {
  return {
    user: {
      id: "30000000-0000-0000-0000-000000000006",
      email: "admin@pgm.local",
      fullName: "Admin PGM",
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

function renderLayout(node: ReactNode) {
  return render(<ToastProvider>{node}</ToastProvider>);
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("Layout admin pages (demo data source)", () => {
  it("renders the layout list with demo rows", async () => {
    const pageModule = await import("@/app/admin/layout/page");
    renderLayout(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Layouts" })).toBeInTheDocument();
    expect(screen.getByText("Nogalera")).toBeInTheDocument();
    expect(screen.getByText("NOG")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nogalera/ })).toHaveAttribute(
      "href",
      `/admin/layout/${DEMO_LAYOUT_ID}`
    );
  });

  it("renders the editor canvas with elements, positions and reported stock", async () => {
    const pageModule = await import("@/app/admin/layout/[id]/page");
    renderLayout(
      await pageModule.default({ params: Promise.resolve({ id: DEMO_LAYOUT_ID }) })
    );

    expect(screen.getByRole("heading", { name: "Nogalera" })).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lienzo estructurado" })).toBeInTheDocument();

    expect(screen.getAllByText("M1-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GAL-LAMOSA-01").length).toBeGreaterThan(0);

    expect(screen.getByText("M1-01-RF-B01-P01")).toBeInTheDocument();
    expect(screen.getAllByText("SKU 7500000000017").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Revisar").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Tienda (backroom)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("130 pz").length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { name: "Historial de cambios" })).toBeInTheDocument();
    expect(screen.getByText("Layout creado")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Publicar v1/ })
    ).toBeInTheDocument();
    expect(screen.queryByText("Solo lectura")).not.toBeInTheDocument();
  });

  it("shows a read-only view and hides publish actions without permissions", async () => {
    const identity = await import("@/features/identity/application");
    vi.mocked(identity.requirePermission).mockResolvedValueOnce(
      makeSession(["layout.read"])
    );
    const pageModule = await import("@/app/admin/layout/[id]/page");
    renderLayout(
      await pageModule.default({ params: Promise.resolve({ id: DEMO_LAYOUT_ID }) })
    );

    expect(screen.getByRole("heading", { name: "Nogalera" })).toBeInTheDocument();
    expect(screen.getByText("Solo lectura")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Publicar v1/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Restaurar/ })).not.toBeInTheDocument();
  });

  it("shows an empty state when the layout does not exist", async () => {
    const pageModule = await import("@/app/admin/layout/[id]/page");
    renderLayout(
      await pageModule.default({
        params: Promise.resolve({ id: "A0000000-0000-0000-0000-000000009999" }),
      })
    );

    expect(screen.getByText("Layout no encontrado")).toBeInTheDocument();
    expect(screen.getByText("No se encontró el layout")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a layouts" })).toHaveAttribute(
      "href",
      "/admin/layout"
    );
  });

  it("shows the stock-change actions and a confirm button for a flagged position with a suggestion", async () => {
    const { LayoutEditor } = await import("@/features/layout/components/layout-editor");
    const { getLayout, listPositionsWithStock, listVersionHistory } = await import(
      "@/features/layout/application"
    );
    const {
      ADMIN,
      LAYOUT_NOGALERA,
      ORG_A,
      POSITION_M1_01_RF_P01,
      VARIANT_051,
      VARIANT_052,
      actor,
      makeContext,
    } = await import("./helpers");

    const context = makeContext();
    const detail = await getLayout(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const positionsWithStock = await listPositionsWithStock(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const history = await listVersionHistory(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    renderLayout(
      <LayoutEditor
        layout={detail.layout}
        elements={detail.elements}
        positionsWithStock={positionsWithStock}
        history={history}
        branch={null}
        variantByVariantId={
          new Map([
            [VARIANT_051, { id: VARIANT_051, sku: "7500000000017" }],
            [VARIANT_052, { id: VARIANT_052, sku: "7500000000031" }],
          ])
        }
        suggestions={
          new Map([
            [POSITION_M1_01_RF_P01, { id: VARIANT_052, sku: "7500000000031" }],
          ])
        }
        permissions={{ canEdit: true, canPublish: true, canManage: true }}
      />
    );

    expect(
      screen.getByRole("button", { name: "Detectar cambios de stock" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Reemplazo sugerido:").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Confirmar reemplazo" })).toBeInTheDocument();
  });

  it("hides the stock-change actions and confirm button in read-only mode", async () => {
    const { LayoutEditor } = await import("@/features/layout/components/layout-editor");
    const { getLayout, listPositionsWithStock, listVersionHistory } = await import(
      "@/features/layout/application"
    );
    const {
      ADMIN,
      LAYOUT_NOGALERA,
      ORG_A,
      POSITION_M1_01_RF_P01,
      VARIANT_051,
      VARIANT_052,
      actor,
      makeContext,
    } = await import("./helpers");

    const context = makeContext();
    const detail = await getLayout(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const positionsWithStock = await listPositionsWithStock(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const history = await listVersionHistory(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    renderLayout(
      <LayoutEditor
        layout={detail.layout}
        elements={detail.elements}
        positionsWithStock={positionsWithStock}
        history={history}
        branch={null}
        variantByVariantId={
          new Map([
            [VARIANT_051, { id: VARIANT_051, sku: "7500000000017" }],
            [VARIANT_052, { id: VARIANT_052, sku: "7500000000031" }],
          ])
        }
        suggestions={
          new Map([
            [POSITION_M1_01_RF_P01, { id: VARIANT_052, sku: "7500000000031" }],
          ])
        }
        permissions={{ canEdit: false, canPublish: false, canManage: false }}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Detectar cambios de stock" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar reemplazo" })
    ).not.toBeInTheDocument();
    // The suggestion itself is informational and still rendered.
    expect(screen.getAllByText("Reemplazo sugerido:").length).toBeGreaterThan(0);
  });
});
