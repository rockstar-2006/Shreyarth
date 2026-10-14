'use client';

import { useState } from 'react';
import { useScholarships } from '@/lib/hooks/useScholarships';
import { ScholarshipCard } from '@/components/scholarship/ScholarshipCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import { ScholarshipStatus } from '@/types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'voting_open', label: 'Voting Open' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminScholarshipsPage() {
  const { scholarships, loading } = useScholarships();
  const [filterStatus, setFilterStatus] = useState<ScholarshipStatus | ''>('');

  const filtered = filterStatus
    ? scholarships.filter((s) => s.status === filterStatus)
    : scholarships;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon">Scholarships</h1>
        <Link href="/admin/scholarships/new">
          <Button aria-label="Create new scholarship">+ New Scholarship</Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 max-w-xs">
        <Select
          options={statusOptions}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ScholarshipStatus | '')}
          aria-label="Filter by status"
          label="Filter by status"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-smvitm-textSecondary">
          <p className="text-lg font-medium mb-2">No scholarships found.</p>
          <Link href="/admin/scholarships/new">
            <Button variant="secondary">Create your first scholarship</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} role="admin" />
          ))}
        </div>
      )}
    </div>
  );
}
