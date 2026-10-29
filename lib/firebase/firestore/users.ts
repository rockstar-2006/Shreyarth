import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { UserProfile } from '@/types';
import { UserRole } from '@/types/auth';

const COLLECTION = 'users';

export async function createUserProfile(user: Omit<UserProfile, 'createdAt'>): Promise<void> {
  const ref = doc(db, COLLECTION, user.uid);
  await setDoc(ref, {
    ...user,
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const col = collection(db, COLLECTION);
  const cleanEmail = email.toLowerCase().trim();
  const q = query(col, where('email', '==', cleanEmail));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docData = snap.docs[0];
    return { uid: docData.id, ...docData.data() } as UserProfile;
  }
  // Case-insensitive fallback across users
  const allUsersSnap = await getDocs(col);
  const match = allUsersSnap.docs.find(
    (d) => (d.data().email || '').toLowerCase().trim() === cleanEmail
  );
  if (match) {
    return { uid: match.id, ...match.data() } as UserProfile;
  }
  return null;
}

export async function listUsers(role?: UserRole): Promise<UserProfile[]> {
  const col = collection(db, COLLECTION);
  const q = role ? query(col, where('role', '==', role)) : query(col);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  await updateDoc(ref, data as Record<string, unknown>);
}

export async function saveCommitteeMembersBulk(
  members: {
    slNo?: number | string;
    name: string;
    designation: string;
    department: string;
    email: string;
    contactNumber: string;
  }[]
): Promise<{ savedCount: number }> {
  let savedCount = 0;
  for (const member of members) {
    const cleanUid = `swb_${member.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const ref = doc(db, COLLECTION, cleanUid);
    await setDoc(
      ref,
      {
        uid: cleanUid,
        slNo: member.slNo ?? savedCount + 1,
        name: member.name,
        email: member.email.toLowerCase().trim(),
        role: 'swb_member',
        department: member.department,
        designation: member.designation,
        contactNumber: member.contactNumber,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    savedCount++;
  }
  return { savedCount };
}

