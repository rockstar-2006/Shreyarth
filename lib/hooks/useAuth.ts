'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { 
  onAuthChange, 
  signIn as firebaseSignIn, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signOut as firebaseSignOut 
} from '@/lib/firebase/auth';
import { getUser, getUserByEmail, createUserProfile } from '@/lib/firebase/firestore/users';
import { UserProfile } from '@/types';

export interface UseAuthReturn {
  firebaseUser: User | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
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
          let profile = await getUser(fbUser.uid);
          if (!profile && fbUser.email) {
            const existingByEmail = await getUserByEmail(fbUser.email);
            if (existingByEmail) {
              profile = {
                ...existingByEmail,
                uid: fbUser.uid,
                name: existingByEmail.name || fbUser.displayName || 'Faculty Member',
                email: fbUser.email.toLowerCase(),
              };
              await createUserProfile(profile);
            }
          }
          if (!profile) {
            await firebaseSignOut();
            setUser(null);
          } else {
            setUser(profile);
          }
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

  const signInWithGoogle = useCallback(async (): Promise<UserProfile> => {
    const credential = await firebaseSignInWithGoogle();
    const fbUser = credential.user;
    if (!fbUser.email) {
      throw new Error('Google account must have a valid email address.');
    }

    // 1. Check if user profile already exists with this Google UID
    let profile = await getUser(fbUser.uid);

    // 2. If not, lookup by email from uploaded Committee Excel
    if (!profile) {
      const existingByEmail = await getUserByEmail(fbUser.email);
      if (existingByEmail) {
        profile = {
          ...existingByEmail,
          uid: fbUser.uid,
          name: existingByEmail.name || fbUser.displayName || 'Faculty Member',
          email: fbUser.email.toLowerCase(),
          role: existingByEmail.role || 'swb_member',
        };
        await createUserProfile(profile);
      } else if (
        fbUser.email.toLowerCase() === 'admin@smvitm.edu.in' ||
        fbUser.email.toLowerCase().startsWith('admin@')
      ) {
        profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Administrator',
          email: fbUser.email.toLowerCase(),
          role: 'admin',
          department: 'Administration',
          createdAt: Timestamp.now(),
        };
        await createUserProfile(profile);
      }
    }

    if (!profile) {
      // Unlink session if unauthorized
      await firebaseSignOut();
      throw new Error(
        `Access Restricted: The Google account (${fbUser.email}) is not registered in the Faculty / Committee member roster. Please ask the administrator to upload your email in the Committee Excel sheet.`
      );
    }

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

  return { firebaseUser, user, loading, signIn, signInWithGoogle, signOut };
}
