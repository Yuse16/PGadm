import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders project name", () => {
    render(<HomePage />);
    expect(screen.getByText("PGadm")).toBeInTheDocument();
  });

  it("renders foundation status", () => {
    render(<HomePage />);
    expect(screen.getByText("Fundación técnica activa")).toBeInTheDocument();
  });

  it("renders health check link", () => {
    render(<HomePage />);
    expect(screen.getByText("Health Check")).toBeInTheDocument();
  });
});
