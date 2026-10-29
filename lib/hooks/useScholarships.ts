'use client';

import { useState, useEffect } from 'react';
import { subscribeToScholarships } from '@/lib/firebase/firestore/scholarships';
import { Scholarship, ScholarshipStatus } from '@/types';

export function useScholarships(status?: ScholarshipStatus) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToScholarships((data) => {
      setScholarships(data);
      setLoading(false);
    }, status);

    return () => unsubscribe();
  }, [status]);

  return { scholarships, loading };
}
