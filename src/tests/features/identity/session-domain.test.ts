import { describe, it, expect } from "vitest";
import {
  SESSION_STATUSES,
  hasPermission,
  hasRole,
  isSessionStatus,
  type AuthorizationState,
  type SessionState,
} from "@/features/identity/domain";

describe("identity session domain", () => {
  it("exports the required session statuses", () => {
    expect(SESSION_STATUSES).toEqual([
      "loading",
      "unauthenticated",
      "authenticated",
      "expired",
      "inactive",
      "forbidden",
      "error",
    ]);
  });

  it("narrows session status strings", () => {
    expect(isSessionStatus("authenticated")).toBe(true);
    expect(isSessionStatus("unknown")).toBe(false);
  });

  it("models discriminated session states without any", () => {
    const states: SessionState[] = [
      { status: "loading" },
      { status: "unauthenticated" },
      {
        status: "authenticated",
        session: {
          user: {
            id: "u1",
            email: "usuario@example.test",
            fullName: "Usuario de prueba",
            status: "active",
          },
          organizationId: "o1",
          organizationName: "Plomería García",
          branchId: "b1",
          branchName: "Nogalera",
          roles: [
            {
              code: "branch_admin",
              name: "Administrador de sucursal",
              organizationId: "o1",
              branchId: "b1",
            },
          ],
          permissions: [
            { code: "inventory.read", description: "Leer inventario" },
          ],
          issuedAt: "2026-08-01T12:00:00.000Z",
          expiresAt: null,
        },
      },
      { status: "expired", message: "Sesión vencida" },
      { status: "inactive", message: "Cuenta inactiva" },
      { status: "forbidden", message: "Acceso denegado" },
      {
        status: "error",
        error: { code: "SESSION_LOAD_FAILED", message: "Error de sesión" },
      },
    ];

    expect(states).toHaveLength(7);
    expect(states.every((state) => isSessionStatus(state.status))).toBe(true);
  });

  it("evaluates authorization helpers only for authenticated state", () => {
    const authenticated: AuthorizationState = {
      status: "authenticated",
      roles: [
        {
          code: "branch_admin",
          name: "Administrador de sucursal",
          organizationId: "o1",
          branchId: "b1",
        },
      ],
      permissions: [{ code: "inventory.read", description: null }],
    };

    expect(hasPermission(authenticated, "inventory.read")).toBe(true);
    expect(hasPermission(authenticated, "orders.write")).toBe(false);
    expect(hasRole(authenticated, "branch_admin")).toBe(true);
    expect(hasPermission({ status: "forbidden", message: "no" }, "inventory.read")).toBe(
      false
    );
  });
});
