import { Timestamp } from 'firebase/firestore';

export type RatingMap = Record<string, number>;

export interface Vote {
  id: string;
  scholarshipId: string;
  swbMemberId: string;
  swbMemberName: string;
  ratings: RatingMap;
  submittedAt: Timestamp | null;
  isSubmitted: boolean;
}
