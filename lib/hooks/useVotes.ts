'use client';

import { useState, useEffect } from 'react';
import { subscribeToVotes } from '@/lib/firebase/firestore/votes';
import { Vote } from '@/types';

export function useVotes(scholarshipId: string, swbMemberId: string | null) {
  const [vote, setVote] = useState<Vote | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scholarshipId || !swbMemberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToVotes(scholarshipId, swbMemberId, (v) => {
      setVote(v);
      setHasVoted(v?.isSubmitted ?? false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [scholarshipId, swbMemberId]);

  return { vote, hasVoted, loading };
}
