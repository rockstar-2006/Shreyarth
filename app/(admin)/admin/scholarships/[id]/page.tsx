'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScholarship, publishScholarship, openVoting, closeVoting } from '@/lib/firebase/firestore/scholarships';
import { Scholarship } from '@/types';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getScholarship(id).then((s) => {
      setScholarship(s);
      setLoading(false);
    });
  }, [id]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await publishScholarship(id);
      toast.success('Scholarship published!');
      setScholarship((prev) => prev ? { ...prev, status: 'published' } : prev);
    } catch {
      toast.error('Failed to publish. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVoting = async () => {
    setActionLoading(true);
    try {
      await openVoting(id);
      toast.success('Voting is now open!');
      setScholarship((prev) => prev ? { ...prev, status: 'voting_open' } : prev);
    } catch {
      toast.error('Failed to open voting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    setActionLoading(true);
    try {
      await closeVoting(id);
      toast.success('Voting closed!');
      router.push(`/admin/scholarships/${id}/results`);
    } catch {
      toast.error('Failed to close voting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!scholarship) {
    return (
      <div className="text-center py-12 text-smvitm-textSecondary">
        <p>Scholarship not found.</p>
        <Link href="/admin/scholarships">
          <Button variant="secondary" className="mt-4">Back to list</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/scholarships">
          <Button variant="ghost" size="sm" aria-label="Back to scholarships list">← Back</Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon flex-1">{scholarship.title}</h1>
        <StatusChip status={scholarship.status} />
      </div>

      <Card accent className="mb-4">
        <CardHeader>
          <h2 className="font-semibold text-smvitm-maroon">Details</h2>
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <p className="text-smvitm-textSecondary font-medium mb-1">Created</p>
              <p className="text-smvitm-text">{formatDate(scholarship.createdAt)}</p>
            </div>
          </div>
        </CardBody>
        <CardFooter className="flex flex-wrap gap-2 justify-end">
          <Link href={`/admin/scholarships/${id}/nominees`}>
            <Button variant="secondary" size="sm">Manage Nominees</Button>
          </Link>
          {scholarship.status === 'closed' && (
            <Link href={`/admin/scholarships/${id}/results`}>
              <Button variant="gold" size="sm">View Results</Button>
            </Link>
          )}
          {scholarship.status === 'draft' && (
            <Button onClick={handlePublish} isLoading={actionLoading} size="sm">
              Publish
            </Button>
          )}
          {scholarship.status === 'published' && (
            <Button onClick={handleOpenVoting} isLoading={actionLoading} size="sm">
              Open Voting
            </Button>
          )}
          {scholarship.status === 'voting_open' && (
            <Button onClick={handleCloseVoting} isLoading={actionLoading} size="sm" variant="danger">
              Close Voting
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
