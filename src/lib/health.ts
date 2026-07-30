import type { HealthStatus } from "@/types";

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
