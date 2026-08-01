import { Profile } from './profile';
import { Role } from './role';
import { Permission } from './permission';
import { OrganizationMembership } from './organization-membership';
import { UserRoleAssignment } from './user-role-assignment';

export interface IdentityRepository {
  getProfile(userId: string): Promise<Profile | null>;
  getMemberships(userId: string): Promise<OrganizationMembership[]>;
  getRoles(organizationId: string): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
  getUserAssignments(organizationId: string, userId: string): Promise<UserRoleAssignment[]>;
}
