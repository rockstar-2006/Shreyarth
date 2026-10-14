'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getScholarship } from '@/lib/firebase/firestore/scholarships';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Scholarship } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Trophy } from 'lucide-react';

export default function StudentScholarshipPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScholarship(id).then((s) => {
      setScholarship(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!scholarship) {
    return (
      <div className="text-center py-12 text-smvitm-textSecondary">
        <p>Scholarship not found.</p>
        <Link href="/student/dashboard"><Button variant="secondary" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  const isWinner = scholarship.status === 'closed' && scholarship.winnerId === user?.uid;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/student/dashboard">
        <Button variant="ghost" size="sm" className="mb-4">← Back</Button>
      </Link>

      {/* Winner Banner */}
      {isWinner && (
        <div className="mb-6 bg-smvitm-gold/10 border-2 border-smvitm-gold rounded-lg px-6 py-6 text-center">
          <Trophy className="mx-auto text-smvitm-gold mb-3" size={48} aria-hidden="true" />
          <h2 className="font-heading text-2xl font-bold text-smvitm-maroon">
            Congratulations! 🎉
          </h2>
          <p className="text-smvitm-textSecondary mt-2 text-lg">
            You have been awarded the <strong className="text-smvitm-maroon">{scholarship.title}</strong>!
          </p>
          <p className="text-smvitm-gold font-bold text-xl mt-2">
            Award: {formatCurrency(scholarship.amount)}
          </p>
        </div>
      )}

      {/* Scholarship Details */}
      <Card accent>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-smvitm-maroon">{scholarship.title}</h1>
            <StatusChip status={scholarship.status} />
          </div>
        </CardHeader>
        <CardBody className="space-y-4 text-sm">
          <div>
            <p className="text-smvitm-textSecondary font-medium mb-1">Description</p>
            <p className="text-smvitm-text">{scholarship.description}</p>
          </div>
          <div>
            <p className="text-smvitm-textSecondary font-medium mb-1">Purpose</p>
            <p className="text-smvitm-text">{scholarship.purpose}</p>
          </div>
          <div>
            <p className="text-smvitm-textSecondary font-medium mb-1">Eligibility Criteria</p>
            <p className="text-smvitm-text whitespace-pre-wrap">{scholarship.eligibilityCriteria}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-smvitm-border">
            <div>
              <p className="text-smvitm-textSecondary font-medium mb-1">Sponsor</p>
              <p className="text-smvitm-text font-semibold">{scholarship.sponsorName}</p>
            </div>
            <div>
              <p className="text-smvitm-textSecondary font-medium mb-1">Amount</p>
              <p className="text-smvitm-maroon font-bold text-lg">{formatCurrency(scholarship.amount)}</p>
            </div>
            <div>
              <p className="text-smvitm-textSecondary font-medium mb-1">Academic Year</p>
              <p className="text-smvitm-text">{scholarship.academicYear}</p>
            </div>
            {scholarship.publishedAt && (
              <div>
                <p className="text-smvitm-textSecondary font-medium mb-1">Published On</p>
                <p className="text-smvitm-text">{formatDate(scholarship.publishedAt)}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
