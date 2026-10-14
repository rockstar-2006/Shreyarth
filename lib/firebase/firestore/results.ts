import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { RatingMap } from '@/types';

const COLLECTION = 'results';

export interface ScholarshipResult {
  scholarshipId: string;
  winnerId: string;
  winnerName: string;
  totalRatings: RatingMap;
  rankedNomineeIds: string[];
  declaredAt: ReturnType<typeof serverTimestamp>;
  declaredBy: string;
}

export async function declareWinner(
  scholarshipId: string,
  winnerId: string,
  winnerName: string,
  totalRatings: RatingMap,
  rankedNomineeIds: string[],
  declaredBy: string
): Promise<void> {
  const ref = doc(db, COLLECTION, scholarshipId);
  await setDoc(ref, {
    scholarshipId,
    winnerId,
    winnerName,
    totalRatings,
    rankedNomineeIds,
    declaredBy,
    declaredAt: serverTimestamp(),
  });
}

export async function getResult(scholarshipId: string): Promise<ScholarshipResult | null> {
  const ref = doc(db, COLLECTION, scholarshipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as ScholarshipResult;
}
