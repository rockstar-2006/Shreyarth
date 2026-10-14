'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getScholarship, declareWinnerOnScholarship } from '@/lib/firebase/firestore/scholarships';
import { listAllVotes } from '@/lib/firebase/firestore/votes';
import { listNominees } from '@/lib/firebase/firestore/nominees';
import { declareWinner as declareWinnerOnResult } from '@/lib/firebase/firestore/results';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { computeResults } from '@/lib/utils/computeResults';
import { ResultsTable } from '@/components/scholarship/ResultsTable';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Scholarship, Nominee, Vote } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [declaring, setDeclaring] = useState(false);

  useEffect(() => {
    Promise.all([
      getScholarship(id),
      listAllVotes(id),
      listNominees(id),
    ]).then(([s, v, n]) => {
      setScholarship(s);
      setVotes(v);
      setNominees(n);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!scholarship) {
    return <div className="text-center py-12 text-smvitm-textSecondary">Scholarship not found.</div>;
  }

  const results = computeResults(votes, nominees);
  const canDeclare = scholarship.status === 'closed' && !scholarship.winnerId;

  const handleDeclareWinner = async () => {
    if (!results.winnerId) return;
    const winner = nominees.find((n) => n.studentId === results.winnerId);
    if (!winner) return;
    setDeclaring(true);
    try {
      await declareWinnerOnResult(
        id,
        results.winnerId,
        winner.studentName,
        Object.fromEntries(results.rankings.map((r) => [r.nomineeId, r.totalScore])),
        results.rankings.map((r) => r.nomineeId),
        user?.uid ?? ''
      );
      await declareWinnerOnScholarship(id, results.winnerId, winner.studentName);
      toast.success(`🏆 ${winner.studentName} declared as winner!`);
      setShowDeclareModal(false);
      setScholarship((prev) => prev ? { ...prev, winnerId: results.winnerId, winnerName: winner.studentName } : prev);
    } catch {
      toast.error('Failed to declare winner. Please try again.');
    } finally {
      setDeclaring(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/scholarships/${id}`}>
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon flex-1">
          Results — {scholarship.title}
        </h1>
      </div>

      {/* Winner Banner */}
      {scholarship.winnerId && scholarship.winnerName && (
        <div className="mb-6 bg-smvitm-gold/10 border-2 border-smvitm-gold rounded-lg px-6 py-4 text-center">
          <p className="text-smvitm-gold font-bold text-lg">🏆 Winner Declared</p>
          <p className="text-smvitm-maroon font-heading text-2xl font-bold mt-1">
            {scholarship.winnerName}
          </p>
          <p className="text-smvitm-textSecondary text-sm mt-1">
            Scholarship Award: {formatCurrency(scholarship.amount)}
          </p>
        </div>
      )}

      {/* Results Card */}
      <Card accent>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold text-smvitm-maroon">Voting Results</h2>
          {canDeclare && !results.isTied && results.winnerId && (
            <Button onClick={() => setShowDeclareModal(true)} variant="gold">
              🏆 Declare Winner
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <ResultsTable
            rankings={results.rankings}
            isTied={results.isTied}
            tiedNomineeIds={results.tiedNomineeIds}
            totalVoters={results.totalVoters}
            totalSWBMembers={scholarship.swbMemberIds.length || 16}
          />
        </CardBody>
      </Card>

      {/* Declare Winner Modal */}
      <Modal
        isOpen={showDeclareModal}
        onClose={() => setShowDeclareModal(false)}
        title="Declare Winner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeclareModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleDeclareWinner} isLoading={declaring}>
              Confirm Declaration
            </Button>
          </>
        }
      >
        {results.winnerId && (
          <div>
            <p className="text-smvitm-textSecondary mb-4">
              You are about to declare the winner for <strong>{scholarship.title}</strong>.
            </p>
            <div className="bg-smvitm-gold/10 border border-smvitm-gold rounded-lg px-4 py-3 text-center">
              <p className="text-smvitm-maroon font-bold text-lg">
                {nominees.find((n) => n.studentId === results.winnerId)?.studentName}
              </p>
              <p className="text-smvitm-textSecondary text-sm">
                Total Score: {results.rankings[0]?.totalScore} | {results.totalVoters} voter(s)
              </p>
            </div>
            <p className="text-sm text-smvitm-textSecondary mt-3">
              This action will be recorded and cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
