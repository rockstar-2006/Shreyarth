'use client';

import { useScholarships } from '@/lib/hooks/useScholarships';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { ScholarshipCard } from '@/components/scholarship/ScholarshipCard';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SWBDashboardPage() {
  const { user } = useAuthContext();
  const { scholarships, loading } = useScholarships();

  // Filter scholarships assigned to this SWB member
  const myScholarships = scholarships.filter(
    (s) => s.swbMemberIds.includes(user?.uid ?? '') || s.status === 'voting_open' || s.status === 'published'
  );

  const pendingVote = myScholarships.filter((s) => s.status === 'voting_open');
  const others = myScholarships.filter((s) => s.status !== 'voting_open');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon">
          SWB Member Dashboard
        </h1>
        <p className="text-smvitm-textSecondary mt-1">
          Welcome, <span className="font-semibold text-smvitm-text">{user?.name}</span>. Cast your votes on open scholarships.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {pendingVote.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-heading text-lg font-semibold text-smvitm-text">Pending Your Vote</h2>
                <Badge variant="gold">{pendingVote.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingVote.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s} role="swb_member" />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-smvitm-text mb-4">Other Scholarships</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {others.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s} role="swb_member" />
                ))}
              </div>
            </div>
          )}

          {myScholarships.length === 0 && (
            <Card>
              <CardBody className="text-center py-12 text-smvitm-textSecondary">
                <p className="text-lg font-medium mb-2">No scholarships assigned to you yet.</p>
                <p className="text-sm">The admin will assign you to scholarship voting panels.</p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
