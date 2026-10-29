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
  caste?: string;
  income?: number | string;
  prevScholarship?: string;
  mobileNo?: string;
  /**
   * Admin-written profile of the student — achievements, background, reason
   * for nomination. Visible to all SWB members on the voting page.
   */
  description: string;
  addedAt: Timestamp;
}
