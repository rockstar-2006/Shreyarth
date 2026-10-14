'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getScholarship } from '@/lib/firebase/firestore/scholarships';
import { listNominees } from '@/lib/firebase/firestore/nominees';
import { submitVote } from '@/lib/firebase/firestore/votes';
import { useVotes } from '@/lib/hooks/useVotes';
import { VotingForm } from '@/components/scholarship/VotingForm';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatCurrency } from '@/lib/utils/formatters';
import { Scholarship, Nominee, RatingMap } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function VotePage() {
  const { scholarshipId } = useParams<{ scholarshipId: string }>();
  const { user } = useAuthContext();

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { vote, hasVoted, loading: voteLoading } = useVotes(scholarshipId, user?.uid ?? null);

  useEffect(() => {
    Promise.all([
      getScholarship(scholarshipId),
      listNominees(scholarshipId),
    ]).then(([s, n]) => {
      setScholarship(s);
      setNominees(n);
      setLoading(false);
    });
  }, [scholarshipId]);

  const handleSubmit = async (ratings: RatingMap) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitVote(scholarshipId, user.uid, user.name, ratings);
      toast.success('Your votes have been submitted!');
    } catch {
      toast.error('Failed to submit votes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || voteLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!scholarship) {
    return (
      <div className="text-center py-12 text-smvitm-textSecondary">
        <p>Scholarship not found.</p>
        <Link href="/swb/dashboard"><Button variant="secondary" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  if (scholarship.status !== 'voting_open' && scholarship.status !== 'published') {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/swb/dashboard"><Button variant="ghost" size="sm" className="mb-4">← Back</Button></Link>
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-lg font-medium text-smvitm-textSecondary mb-2">
              Voting is not open for this scholarship.
            </p>
            <p className="text-sm text-smvitm-textSecondary">
              Status: <StatusChip status={scholarship.status} />
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/swb/dashboard"><Button variant="ghost" size="sm" className="mb-4">← Back</Button></Link>

      {/* Scholarship Info */}
      <Card accent className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-smvitm-maroon">{scholarship.title}</h1>
            <StatusChip status={scholarship.status} />
          </div>
        </CardHeader>
        <CardBody className="text-sm space-y-2">
          <p className="text-smvitm-textSecondary">{scholarship.description}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <span className="text-smvitm-textSecondary">Amount: </span>
              <span className="font-semibold text-smvitm-maroon">{formatCurrency(scholarship.amount)}</span>
            </div>
            <div>
              <span className="text-smvitm-textSecondary">Sponsor: </span>
              <span className="font-medium">{scholarship.sponsorName}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Eligibility */}
      <Card className="mb-6">
        <CardBody>
          <h2 className="font-semibold text-smvitm-maroon mb-2">Eligibility Criteria</h2>
          <p className="text-sm text-smvitm-textSecondary whitespace-pre-wrap">{scholarship.eligibilityCriteria}</p>
        </CardBody>
      </Card>

      {/* Voting */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-smvitm-maroon mb-4">
          {hasVoted ? 'Your Submitted Ratings' : `Rate ${nominees.length} Nominee(s)`}
        </h2>
        <VotingForm
          nominees={nominees}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          alreadyVoted={hasVoted}
          existingRatings={vote?.ratings ?? {}}
        />
      </div>
    </div>
  );
}
