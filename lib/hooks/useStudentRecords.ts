'use client';

import { useState, useEffect } from 'react';
import { subscribeToStudentRecords } from '@/lib/firebase/firestore/students';
import { StudentRecord } from '@/types';

export function useStudentRecords() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToStudentRecords((data) => {
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { students, loading };
}
