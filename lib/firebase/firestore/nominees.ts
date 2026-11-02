import {
  collection,
  DocumentData,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
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
  
  // Sanitize all fields to ensure no `undefined` value is passed to Firestore addDoc
  const payload: DocumentData = {
    scholarshipId: data.scholarshipId || '',
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    department: data.department || 'B.E',
    semester: data.semester || 'Regular',
    cgpa: typeof data.cgpa === 'number' && !isNaN(data.cgpa) ? data.cgpa : 8.0,
    rollNumber: data.rollNumber || data.studentId || '',
    caste: data.caste || '',
    income: data.income !== undefined && data.income !== null ? data.income : 0,
    prevScholarship: data.prevScholarship || '',
    mobileNo: data.mobileNo || '',
    description: data.description || '',
    addedAt: serverTimestamp(),
  };

  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function listNominees(scholarshipId: string): Promise<Nominee[]> {
  try {
    const col = collection(db, COLLECTION);
    const q = query(
      col,
      where('scholarshipId', '==', scholarshipId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Nominee));
    return list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  } catch (err) {
    console.error('Failed to list nominees:', err);
    return [];
  }
}

export async function removeNominee(nomineeId: string): Promise<void> {
  const ref = doc(db, COLLECTION, nomineeId);
  await deleteDoc(ref);
}

export async function updateNominee(
  nomineeId: string,
  updates: Partial<Omit<Nominee, 'id' | 'addedAt' | 'scholarshipId'>>
): Promise<void> {
  const ref = doc(db, COLLECTION, nomineeId);
  const cleanUpdates: DocumentData = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) {
      cleanUpdates[k] = v;
    }
  }
  await updateDoc(ref, cleanUpdates);
}

export function subscribeToNominees(
  scholarshipId: string,
  callback: (nominees: Nominee[]) => void
): Unsubscribe {
  const col = collection(db, COLLECTION);
  const q = query(
    col,
    where('scholarshipId', '==', scholarshipId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const nominees = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Nominee));
      nominees.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      callback(nominees);
    },
    (err) => {
      console.warn('subscribeToNominees notice:', err);
      callback([]);
    }
  );
}
