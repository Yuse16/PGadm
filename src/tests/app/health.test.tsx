import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HealthPage from "@/app/health/page";

vi.mock("@/lib/health", () => ({
  getHealthStatus: () => ({
    status: "ok" as const,
    version: "0.1.0",
    timestamp: "2026-07-29T00:00:00.000Z",
    uptime: 123,
  }),
}));

describe("HealthPage", () => {
  it("renders health status", () => {
    render(<HealthPage />);
    expect(screen.getByText("Status: OK")).toBeInTheDocument();
  });

  it("renders version", () => {
    render(<HealthPage />);
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
  });

  it("renders uptime", () => {
    render(<HealthPage />);
    expect(screen.getByText("123s")).toBeInTheDocument();
  });
});
