export type MembershipStatus = 'active' | 'inactive';

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}
