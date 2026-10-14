'use client';

import { useScholarships } from '@/lib/hooks/useScholarships';
import { Card, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Award, BookOpen, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ScholarshipCard } from '@/components/scholarship/ScholarshipCard';

export default function AdminDashboardPage() {
  const { scholarships, loading } = useScholarships();

  const stats = {
    total: scholarships.length,
    drafts: scholarships.filter((s) => s.status === 'draft').length,
    active: scholarships.filter((s) => s.status === 'published' || s.status === 'voting_open').length,
    closed: scholarships.filter((s) => s.status === 'closed').length,
  };

  const recent = scholarships.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon">Admin Dashboard</h1>
        <Link href="/admin/scholarships/new">
          <Button aria-label="Create new scholarship">+ New Scholarship</Button>
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card accent>
              <CardBody className="flex items-center gap-4">
                <div className="p-2 bg-smvitm-maroon/10 rounded-lg">
                  <BookOpen className="text-smvitm-maroon" size={24} />
                </div>
                <div>
                  <p className="text-sm text-smvitm-textSecondary">Total</p>
                  <p className="text-2xl font-bold text-smvitm-maroon">{stats.total}</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="text-gray-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-smvitm-textSecondary">Drafts</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.drafts}</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Award className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-smvitm-textSecondary">Active</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-smvitm-textSecondary">Closed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                </div>
              </CardBody>
            </Card>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-smvitm-maroon mb-4">Recent Scholarships</h2>
            {recent.length === 0 ? (
              <Card>
                <CardBody className="text-center text-smvitm-textSecondary py-8">
                  <p>No scholarships yet. <Link href="/admin/scholarships/new" className="text-smvitm-maroon font-medium hover:underline">Create one now.</Link></p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recent.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s} role="admin" />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
