'use client';

import { useState } from 'react';
import { useScholarships } from '@/lib/hooks/useScholarships';
import { ScholarshipCard } from '@/components/scholarship/ScholarshipCard';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { ScholarshipStatus } from '@/types';
import { Plus, Award } from 'lucide-react';

const STATUSES: { value: ScholarshipStatus | ''; label: string }[] = [
  { value: '',             label: 'All' },
  { value: 'draft',        label: 'Draft' },
  { value: 'published',    label: 'Published' },
  { value: 'voting_open',  label: 'Voting Open' },
  { value: 'closed',       label: 'Closed' },
];

export default function AdminScholarshipsPage() {
  const { scholarships, loading } = useScholarships();
  const [filter, setFilter] = useState<ScholarshipStatus | ''>('');

  const filtered = filter ? scholarships.filter((s) => s.status === filter) : scholarships;

  return (
    <div className="max-w-6xl mx-auto px-1 py-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-smvitm-text">Scholarships</h1>
          <p className="text-smvitm-textSecondary text-sm mt-0.5">
            {scholarships.length} scholarship{scholarships.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/admin/scholarships/new"
          className="inline-flex items-center gap-2 bg-smvitm-maroon hover:bg-smvitm-maroonDark text-white
            text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={16} /> New Scholarship
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-smvitm-bgAlt rounded-lg p-1 mb-6 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === s.value
                ? 'bg-smvitm-surface text-smvitm-maroon shadow-xs font-semibold'
                : 'text-smvitm-textSecondary hover:text-smvitm-text'
            }`}
          >
            {s.label}
            {s.value !== '' && (
              <span className="ml-1.5 text-2xs font-bold opacity-60">
                {scholarships.filter((x) => x.status === s.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-smvitm-surface border border-smvitm-border rounded-xl p-12 text-center">
          <Award size={36} className="text-smvitm-border mx-auto mb-3" />
          <p className="text-smvitm-text font-medium mb-1">No scholarships found</p>
          <p className="text-smvitm-textSecondary text-sm mb-5">
            {filter ? `No scholarships with status "${filter}".` : 'Create your first scholarship to get started.'}
          </p>
          <Link
            href="/admin/scholarships/new"
            className="inline-flex items-center gap-2 bg-smvitm-maroon text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-smvitm-maroonDark transition-colors"
          >
            <Plus size={14} /> Create Scholarship
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ScholarshipCard key={s.id} scholarship={s} role="admin" />
          ))}
        </div>
      )}
    </div>
  );
}
