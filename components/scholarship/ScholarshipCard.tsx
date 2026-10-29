'use client';

import Link from 'next/link';
import { Award, Calendar, User, ArrowRight, Vote } from 'lucide-react';
import { Scholarship } from '@/types';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatCurrency } from '@/lib/utils/formatters';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  role: 'admin' | 'swb_member' | 'student';
}

export function ScholarshipCard({ scholarship, role }: ScholarshipCardProps) {
  const primaryHref =
    role === 'admin'       ? `/admin/scholarships/${scholarship.id}` :
    role === 'swb_member'  ? `/swb/vote/${scholarship.id}` :
                             `/student/scholarship/${scholarship.id}`;

  const isVotingOpen = scholarship.status === 'voting_open' || scholarship.status === 'published';

  const actionLabel =
    role === 'admin'                                       ? 'Manage' :
    role === 'swb_member' && isVotingOpen                  ? 'Rate Students (1–10)' :
    role === 'swb_member'                                  ? 'View Results' :
                                                             'View Details';

  return (
    <div className="group bg-smvitm-surface rounded-xl border border-smvitm-border shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Coloured top stripe */}
      <div className={`h-1 w-full ${isVotingOpen ? 'bg-gold-gradient' : 'bg-smvitm-maroon/70'}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-heading text-base font-semibold text-smvitm-text leading-tight group-hover:text-smvitm-maroon transition-colors line-clamp-2">
            {scholarship.title}
          </h3>
          <StatusChip status={scholarship.status} />
        </div>

        {/* Description */}
        <p className="text-smvitm-textSecondary text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {scholarship.description || 'No description provided.'}
        </p>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-5">
          <div className="flex items-center gap-1.5 text-smvitm-textSecondary">
            <Award size={12} className="text-smvitm-gold flex-shrink-0" />
            <span className="font-semibold text-smvitm-text">{formatCurrency(scholarship.amount)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-smvitm-textSecondary truncate">
            <User size={12} className="text-smvitm-maroon flex-shrink-0" />
            <span className="truncate">{scholarship.sponsorName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-smvitm-textSecondary col-span-2">
            <Calendar size={12} className="text-smvitm-maroon flex-shrink-0" />
            <span>A.Y. {scholarship.academicYear}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-smvitm-border/60">
          <Link
            href={primaryHref}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors
              ${isVotingOpen && role === 'swb_member'
                ? 'bg-smvitm-gold hover:bg-smvitm-goldLight text-white'
                : 'bg-smvitm-maroon hover:bg-smvitm-maroonDark text-white'
              }`}
          >
            {role === 'swb_member' && isVotingOpen && <Vote size={13} />}
            {actionLabel}
          </Link>

          {role === 'admin' && (
            <>
              {scholarship.status === 'draft' && (
                <Link
                  href={`/admin/scholarships/${scholarship.id}/nominees`}
                  className="flex items-center gap-1 text-xs font-medium text-smvitm-maroon hover:text-smvitm-maroonDark px-3 py-2 rounded-lg hover:bg-smvitm-maroonFaint transition-colors"
                >
                  Nominees <ArrowRight size={12} />
                </Link>
              )}
              {scholarship.status === 'closed' && (
                <Link
                  href={`/admin/scholarships/${scholarship.id}/results`}
                  className="flex items-center gap-1 text-xs font-medium text-smvitm-gold hover:text-smvitm-goldLight px-3 py-2 rounded-lg hover:bg-smvitm-goldFaint transition-colors"
                >
                  Results <ArrowRight size={12} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
