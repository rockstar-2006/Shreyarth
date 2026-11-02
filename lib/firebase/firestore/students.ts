import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { StudentRecord } from '@/types';

const COLLECTION = 'student_records';

/**
 * Real-time subscription to all student database records
 */
export function subscribeToStudentRecords(
  callback: (records: StudentRecord[]) => void
): Unsubscribe {
  const col = collection(db, COLLECTION);
  const q = query(col, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          slNo: data.slNo ?? '',
          studentName: data.studentName ?? '',
          usn: data.usn ?? d.id,
          mobileNo: data.mobileNo ?? '',
          caste: data.caste ?? '',
          income: Number(data.income) || 0,
          incomeRaw: data.incomeRaw ?? '',
          scholarshipsReceivedPreviousYear: data.scholarshipsReceivedPreviousYear || 'None',
          hasReceivedPreviousYear: Boolean(data.hasReceivedPreviousYear),
          remarks: data.remarks ?? '—',
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        } as StudentRecord;
      });
      callback(records);
    },
    (err) => {
      console.error('Error subscribing to student records:', err);
      // Fallback query without orderBy in case index isn't built yet
      const fallbackQ = query(col);
      return onSnapshot(fallbackQ, (fallbackSnap) => {
        const records = fallbackSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as StudentRecord[];
        callback(records);
      });
    }
  );
}

/**
 * Save multiple student records in batches (e.g. from Excel upload)
 * Keyed by USN to avoid duplicate student entries
 */
export async function saveStudentRecordsBulk(
  records: Omit<StudentRecord, 'id' | 'createdAt'>[]
): Promise<{ savedCount: number }> {
  let savedCount = 0;
  const chunkSize = 400; // Firestore batch max is 500

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const cleanUsn = (record.usn || `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`)
        .trim()
        .toUpperCase();
      const docRef = doc(db, COLLECTION, cleanUsn);

      batch.set(
        docRef,
        {
          ...record,
          usn: cleanUsn,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      savedCount++;
    }

    await batch.commit();
  }

  return { savedCount };
}

/**
 * Add a single student record manually
 */
export async function addStudentRecord(
  record: Omit<StudentRecord, 'id' | 'createdAt'>
): Promise<string> {
  const cleanUsn = record.usn.trim().toUpperCase();
  const docRef = doc(db, COLLECTION, cleanUsn);
  await setDoc(docRef, {
    ...record,
    usn: cleanUsn,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return cleanUsn;
}

/**
 * Update an existing student record
 */
export async function updateStudentRecord(
  id: string,
  updates: Partial<StudentRecord>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a student record
 */
export async function deleteStudentRecord(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Delete all student records (bulk clear)
 */
export async function clearAllStudentRecords(records: StudentRecord[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const r of chunk) {
      batch.delete(doc(db, COLLECTION, r.id));
    }
    await batch.commit();
  }
}
