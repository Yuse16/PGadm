export type RoleStatus = 'active' | 'inactive';

export interface Role {
  id: string;
  organizationId: string | null; // null for global roles
  code: string;
  name: string;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
}
