export type UserRole = 'admin' | 'swb_member' | 'student';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
