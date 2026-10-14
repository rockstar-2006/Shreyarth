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
