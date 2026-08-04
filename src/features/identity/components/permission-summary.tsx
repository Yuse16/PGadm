import type { UserPermission } from "../domain";

export interface PermissionSummaryProps {
  permissions: readonly UserPermission[];
  emptyMessage?: string;
}

export function PermissionSummary({
  permissions,
  emptyMessage = "Sin permisos asignados.",
}: PermissionSummaryProps) {
  return (
    <section
      aria-labelledby="permission-summary-heading"
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      <h2
        id="permission-summary-heading"
        className="text-base font-semibold text-gray-900"
      >
        Permisos
      </h2>
      {permissions.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {permissions.map((permission) => (
            <li key={permission.code} className="py-2.5">
              <p className="font-mono text-sm font-medium text-gray-900">
                {permission.code}
              </p>
              {permission.description ? (
                <p className="mt-0.5 text-sm text-gray-500">
                  {permission.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
