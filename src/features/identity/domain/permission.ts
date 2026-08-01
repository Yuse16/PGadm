export type PermissionStatus = 'active' | 'inactive';

export interface Permission {
  id: string;
  code: string;
  description: string | null;
  status: PermissionStatus;
  createdAt: Date;
  updatedAt: Date;
}
