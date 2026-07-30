import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  const health = getHealthStatus();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Health Check</h1>
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              health.status === "ok" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium text-gray-900">
            Status: {health.status.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Version</span>
          <span className="text-gray-900 font-mono">{health.version}</span>
          <span className="text-gray-500">Timestamp</span>
          <span className="text-gray-900 font-mono">{health.timestamp}</span>
          <span className="text-gray-500">Uptime</span>
          <span className="text-gray-900 font-mono">
            {Math.round(health.uptime)}s
          </span>
        </div>
      </div>
    </div>
  );
}
