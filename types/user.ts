import { Timestamp } from 'firebase/firestore';
import { UserRole } from './auth';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  rollNumber?: string;
  employeeId?: string;
  createdAt: Timestamp;
}
