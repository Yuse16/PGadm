import type { UserRoleSummary } from "../domain";

export interface RoleBadgeProps {
  role: UserRoleSummary;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      title={role.code}
      className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800"
    >
      <span className="sr-only">Rol: </span>
      {role.name}
    </span>
  );
}
