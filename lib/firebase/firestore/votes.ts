import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { Vote, RatingMap } from '@/types';

const COLLECTION = 'votes';

function voteDocId(scholarshipId: string, swbMemberId: string): string {
  return `${scholarshipId}_${swbMemberId}`;
}

export async function submitVote(
  scholarshipId: string,
  swbMemberId: string,
  swbMemberName: string,
  ratings: RatingMap
): Promise<void> {
  const docId = voteDocId(scholarshipId, swbMemberId);
  const ref = doc(db, COLLECTION, docId);
  await setDoc(ref, {
    scholarshipId,
    swbMemberId,
    swbMemberName,
    ratings,
    isSubmitted: true,
    submittedAt: serverTimestamp(),
  });
}

export async function getVote(
  scholarshipId: string,
  swbMemberId: string
): Promise<Vote | null> {
  const docId = voteDocId(scholarshipId, swbMemberId);
  const ref = doc(db, COLLECTION, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Vote;
}

export async function hasVoted(
  scholarshipId: string,
  swbMemberId: string
): Promise<boolean> {
  const vote = await getVote(scholarshipId, swbMemberId);
  return vote !== null && vote.isSubmitted;
}

export async function listAllVotes(scholarshipId: string): Promise<Vote[]> {
  const col = collection(db, COLLECTION);
  const q = query(col, where('scholarshipId', '==', scholarshipId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote));
}

export function subscribeToVotes(
  scholarshipId: string,
  swbMemberId: string,
  callback: (vote: Vote | null) => void
): Unsubscribe {
  const docId = voteDocId(scholarshipId, swbMemberId);
  const ref = doc(db, COLLECTION, docId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...snap.data() } as Vote);
    }
  });
}
