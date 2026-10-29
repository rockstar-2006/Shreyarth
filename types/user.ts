import { Timestamp } from 'firebase/firestore';
import { UserRole } from './auth';

export interface UserProfile {
  uid: string;
  slNo?: number | string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation?: string;
  contactNumber?: string;
  rollNumber?: string;
  employeeId?: string;
  createdAt: Timestamp;
}
