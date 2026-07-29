export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
  uptime: number;
}

export interface AppConfig {
  name: string;
  version: string;
  environment: string;
}
