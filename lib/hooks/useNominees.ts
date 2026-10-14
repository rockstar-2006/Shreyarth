'use client';

import { useState, useEffect } from 'react';
import { subscribeToNominees } from '@/lib/firebase/firestore/nominees';
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
    const unsubscribe = subscribeToNominees(scholarshipId, (data) => {
      setNominees(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [scholarshipId]);

  return { nominees, loading };
}
