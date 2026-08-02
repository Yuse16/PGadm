import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AccessDenied,
  IdentityErrorState,
  IdentityLoading,
  InactiveAccount,
  SessionExpired,
} from "@/features/identity/components";

describe("identity status components", () => {
  it("renders forbidden access denied messaging", () => {
    render(<AccessDenied message="No autorizado para este módulo." />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText("No autorizado para este módulo.")
    ).toBeInTheDocument();
  });

  it("renders inactive account messaging", () => {
    render(<InactiveAccount message="Cuenta inactiva en Nogalera." />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Cuenta inactiva")).toBeInTheDocument();
    expect(screen.getByText("Cuenta inactiva en Nogalera.")).toBeInTheDocument();
  });

  it("renders expired session messaging", () => {
    render(<SessionExpired message="La sesión ha vencido." />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Sesión vencida")).toBeInTheDocument();
    expect(screen.getByText("La sesión ha vencido.")).toBeInTheDocument();
  });

  it("exposes loading state with aria-live", () => {
    render(<IdentityLoading message="Cargando identidad…" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Cargando identidad…");
  });

  it("renders error without internal payloads", () => {
    render(
      <IdentityErrorState
        title="Error de identidad"
        message="No se pudo completar la operación."
        code="IDENTITY_UI_ERROR"
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("No se pudo completar la operación.");
    expect(alert).toHaveTextContent("IDENTITY_UI_ERROR");
    expect(alert.textContent).not.toMatch(/service_role|stack|SUPABASE_SERVICE_ROLE/i);
  });
});
