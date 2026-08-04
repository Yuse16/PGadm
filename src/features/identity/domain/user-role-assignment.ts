export type AssignmentStatus = 'active' | 'inactive';

export interface UserRoleAssignment {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  branchId: string | null;
  status: AssignmentStatus;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
