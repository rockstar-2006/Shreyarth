'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase/auth';
import { getUser } from '@/lib/firebase/firestore/users';
import { UserProfile } from '@/types';

export interface UseAuthReturn {
  firebaseUser: User | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUser(fbUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    const credential = await firebaseSignIn(email, password);
    const profile = await getUser(credential.user.uid);
    if (!profile) throw new Error('User profile not found. Contact administrator.');
    const idToken = await credential.user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, uid: credential.user.uid }),
    });
    setUser(profile);
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUser(null);
  }, []);

  return { firebaseUser, user, loading, signIn, signOut };
}
