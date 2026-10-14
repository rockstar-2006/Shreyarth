import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { Nominee } from '@/types';

const COLLECTION = 'nominees';

export async function addNominee(
  data: Omit<Nominee, 'id' | 'addedAt'>
): Promise<string> {
  const col = collection(db, COLLECTION);
  const ref = await addDoc(col, {
    ...data,
    addedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listNominees(scholarshipId: string): Promise<Nominee[]> {
  const col = collection(db, COLLECTION);
  const q = query(
    col,
    where('scholarshipId', '==', scholarshipId),
    orderBy('studentName', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Nominee));
}

export async function removeNominee(nomineeId: string): Promise<void> {
  const ref = doc(db, COLLECTION, nomineeId);
  await deleteDoc(ref);
}

export function subscribeToNominees(
  scholarshipId: string,
  callback: (nominees: Nominee[]) => void
): Unsubscribe {
  const col = collection(db, COLLECTION);
  const q = query(
    col,
    where('scholarshipId', '==', scholarshipId),
    orderBy('studentName', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const nominees = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Nominee));
    callback(nominees);
  });
}
