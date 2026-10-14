import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { Scholarship, ScholarshipStatus } from '@/types';

const COLLECTION = 'scholarships';

export async function createScholarship(
  data: Omit<Scholarship, 'id' | 'createdAt' | 'publishedAt' | 'closedAt'>
): Promise<string> {
  const col = collection(db, COLLECTION);
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
    publishedAt: null,
    closedAt: null,
  });
  return ref.id;
}

export async function getScholarship(id: string): Promise<Scholarship | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Scholarship;
}

export async function listScholarships(status?: ScholarshipStatus): Promise<Scholarship[]> {
  const col = collection(db, COLLECTION);
  const q = status
    ? query(col, where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scholarship));
}

export async function updateScholarship(id: string, data: Partial<Scholarship>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, data as Record<string, unknown>);
}

export async function publishScholarship(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'published',
    publishedAt: serverTimestamp(),
  });
}

export async function openVoting(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'voting_open',
  });
}

export async function closeVoting(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'closed',
    closedAt: serverTimestamp(),
  });
}

export async function declareWinnerOnScholarship(
  id: string,
  winnerId: string,
  winnerName: string
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    winnerId,
    winnerName,
    status: 'closed',
    closedAt: serverTimestamp(),
  });
}

export function subscribeToScholarships(
  callback: (scholarships: Scholarship[]) => void,
  status?: ScholarshipStatus
): Unsubscribe {
  const col = collection(db, COLLECTION);
  const q = status
    ? query(col, where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const scholarships = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scholarship));
    callback(scholarships);
  });
}
