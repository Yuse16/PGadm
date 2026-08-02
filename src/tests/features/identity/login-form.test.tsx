import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/features/identity/components";
import type { LoginCredentials } from "@/features/identity/domain";

describe("LoginForm", () => {
  it("renders associated email and password labels", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" })
    ).toBeInTheDocument();
  });

  it("submits credentials through the onSubmit prop", async () => {
    const onSubmit = vi.fn(async (_credentials: LoginCredentials) => {
      void _credentials;
    });
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "usuario@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secret-value" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "usuario@example.test",
        password: "secret-value",
      });
    });
  });

  it("shows submitting state and disables controls", () => {
    render(<LoginForm onSubmit={vi.fn()} submitting />);

    expect(
      screen.getByRole("button", { name: "Iniciando sesión…" })
    ).toBeDisabled();
    expect(screen.getByLabelText("Correo")).toBeDisabled();
    expect(screen.getByLabelText("Contraseña")).toBeDisabled();
  });

  it("announces a general error message", () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        errorMessage="Credenciales no válidas"
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Credenciales no válidas");
  });

  it("shows a visual recovery affordance without claiming success", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByText(/Recuperar contraseña/)).toBeInTheDocument();
    expect(screen.getByText(/próximamente/)).toBeInTheDocument();
    expect(screen.queryByText(/sesión iniciada/i)).not.toBeInTheDocument();
  });
});
