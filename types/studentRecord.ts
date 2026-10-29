import { Timestamp } from 'firebase/firestore';

export interface StudentRecord {
  id: string;
  slNo?: number | string;
  studentName: string;
  usn: string;
  mobileNo: string;
  caste: string;
  income: number;
  incomeRaw?: string;
  scholarshipsReceivedPreviousYear: string;
  hasReceivedPreviousYear: boolean;
  remarks: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
