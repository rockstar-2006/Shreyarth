'use client';

import { useState, useEffect } from 'react';
import { subscribeToNominees, listNominees } from '@/lib/firebase/firestore/nominees';
import { Nominee } from '@/types';

export function useNominees(scholarshipId: string) {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scholarshipId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let isSubscribed = true;

    // Safety timeout: ensure loading is NEVER stuck indefinitely
    const timeout = setTimeout(async () => {
      if (isSubscribed && loading) {
        try {
          const directData = await listNominees(scholarshipId);
          if (isSubscribed) {
            setNominees(directData);
            setLoading(false);
          }
        } catch {
          if (isSubscribed) setLoading(false);
        }
      }
    }, 1500);

    const unsubscribe = subscribeToNominees(scholarshipId, (data) => {
      if (isSubscribed) {
        clearTimeout(timeout);
        setNominees(data);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [scholarshipId]);

  return { nominees, loading };
}
