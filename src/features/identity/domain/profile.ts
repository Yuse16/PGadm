export type ProfileStatus = 'active' | 'inactive';

export interface Profile {
  id: string; // uuid from auth.users
  fullName: string | null;
  email: string | null;
  phone: string | null;
  status: ProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}
