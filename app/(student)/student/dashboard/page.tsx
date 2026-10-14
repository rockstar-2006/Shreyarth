'use client';

import { useScholarships } from '@/lib/hooks/useScholarships';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { ScholarshipCard } from '@/components/scholarship/ScholarshipCard';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardBody } from '@/components/ui/Card';

export default function StudentDashboardPage() {
  const { user } = useAuthContext();
  const { scholarships, loading } = useScholarships();

  // Show scholarships where this student might be a nominee (we show published/voting_open/closed)
  const visible = scholarships.filter(
    (s) => s.status === 'published' || s.status === 'voting_open' || s.status === 'closed'
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon">My Scholarships</h1>
        <p className="text-smvitm-textSecondary mt-1">
          Welcome, <span className="font-semibold text-smvitm-text">{user?.name}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : visible.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-smvitm-textSecondary">
            <p className="text-lg font-medium mb-2">No active scholarships at the moment.</p>
            <p className="text-sm">Check back later or contact your administrator.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <ScholarshipCard key={s.id} scholarship={s} role="student" />
          ))}
        </div>
      )}
    </div>
  );
}
