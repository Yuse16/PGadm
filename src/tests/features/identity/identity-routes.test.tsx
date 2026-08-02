import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import IdentityPreviewPage from "@/app/admin/identity-preview/page";
import LoginPage from "@/app/login/page";
import UnauthorizedPage from "@/app/unauthorized/page";

describe("identity routes", () => {
  it("marks the login page as prepared without real auth", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(
        "Interfaz preparada — autenticación real pendiente de integración"
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
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
