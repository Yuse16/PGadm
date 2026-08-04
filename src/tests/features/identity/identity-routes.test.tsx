import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IdentityPreviewPage from "@/app/admin/identity-preview/page";
import LoginPage from "@/app/login/page";
import UnauthorizedPage from "@/app/unauthorized/page";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in a route render test");
  }),
}));

describe("identity routes", () => {
  it("renders the login form wired to the real auth action", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" })
    ).toBeInTheDocument();
  });

  it("renders unauthorized visuals for forbidden, inactive and expired reasons", async () => {
    const forbidden = await UnauthorizedPage({
      searchParams: Promise.resolve({ reason: "forbidden" }),
    });
    const { unmount: unmountForbidden } = render(forbidden);
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    unmountForbidden();

    const inactive = await UnauthorizedPage({
      searchParams: Promise.resolve({ reason: "inactive" }),
    });
    const { unmount: unmountInactive } = render(inactive);
    expect(screen.getByText("Cuenta inactiva")).toBeInTheDocument();
    unmountInactive();

    const expired = await UnauthorizedPage({
      searchParams: Promise.resolve({ reason: "expired" }),
    });
    render(expired);
    expect(screen.getByText("Sesión vencida")).toBeInTheDocument();
  });

  it("marks the identity preview as simulated data", () => {
    render(<IdentityPreviewPage />);

    expect(
      screen.getByText("Vista previa de identidad — datos simulados")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Usuario de prueba").length).toBeGreaterThan(0);
    expect(screen.getAllByText("usuario@example.test").length).toBeGreaterThan(0);
    expect(screen.getByText("Administrador de sucursal")).toBeInTheDocument();
    expect(screen.getAllByText(/Nogalera/).length).toBeGreaterThan(0);
    expect(screen.getByText("1. Usuario autenticado")).toBeInTheDocument();
    expect(screen.getByText("2. Cuenta inactiva")).toBeInTheDocument();
    expect(screen.getByText("3. Sesión vencida")).toBeInTheDocument();
    expect(screen.getByText("4. Acceso denegado")).toBeInTheDocument();
    expect(screen.getByText("5. Error")).toBeInTheDocument();
    expect(screen.getByText("6. Loading")).toBeInTheDocument();
  });
});
