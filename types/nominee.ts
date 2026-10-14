import { Timestamp } from 'firebase/firestore';

export interface Nominee {
  id: string;
  scholarshipId: string;
  studentId: string;
  studentName: string;
  department: string;
  semester: string;
  cgpa: number;
  rollNumber: string;
  addedAt: Timestamp;
}
