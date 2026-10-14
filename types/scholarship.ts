import { Timestamp } from 'firebase/firestore';

export type ScholarshipStatus = 'draft' | 'published' | 'voting_open' | 'closed';

export interface Scholarship {
  id: string;
  title: string;
  description: string;
  purpose: string;
  eligibilityCriteria: string;
  sponsorName: string;
  sponsorDetails: string;
  amount: number;
  academicYear: string;
  status: ScholarshipStatus;
  swbMemberIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  publishedAt: Timestamp | null;
  closedAt: Timestamp | null;
  winnerId: string | null;
  winnerName: string | null;
}
