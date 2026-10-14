'use client';

import Link from 'next/link';
import { Award, Calendar, User } from 'lucide-react';
import { Scholarship } from '@/types';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  role: 'admin' | 'swb_member' | 'student';
}

export function ScholarshipCard({ scholarship, role }: ScholarshipCardProps) {
  return (
    <Card accent>
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-heading text-lg font-semibold text-smvitm-maroon leading-tight">
            {scholarship.title}
          </h3>
          <StatusChip status={scholarship.status} />
        </div>

        <p className="text-smvitm-textSecondary text-sm mb-4 line-clamp-2">
          {scholarship.description}
        </p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-smvitm-textSecondary">
            <Award size={14} className="text-smvitm-gold flex-shrink-0" />
            <span className="font-semibold text-smvitm-text">{formatCurrency(scholarship.amount)}</span>
          </div>
          <div className="flex items-center gap-2 text-smvitm-textSecondary">
            <User size={14} className="text-smvitm-maroon flex-shrink-0" />
            <span className="truncate">{scholarship.sponsorName}</span>
          </div>
          <div className="flex items-center gap-2 text-smvitm-textSecondary">
            <Calendar size={14} className="text-smvitm-maroon flex-shrink-0" />
            <span>{scholarship.academicYear}</span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-end gap-2">
        {role === 'admin' && (
          <>
            <Link href={`/admin/scholarships/${scholarship.id}`}>
              <Button size="sm" variant="secondary" aria-label={`View ${scholarship.title}`}>View</Button>
            </Link>
            {scholarship.status === 'draft' && (
              <Link href={`/admin/scholarships/${scholarship.id}/nominees`}>
                <Button size="sm" aria-label={`Add nominees to ${scholarship.title}`}>Add Nominees</Button>
              </Link>
            )}
            {scholarship.status === 'closed' && (
              <Link href={`/admin/scholarships/${scholarship.id}/results`}>
                <Button size="sm" variant="gold" aria-label={`View results for ${scholarship.title}`}>Results</Button>
              </Link>
            )}
          </>
        )}

        {role === 'swb_member' && (
          <>
            {scholarship.status === 'voting_open' && (
              <Link href={`/swb/vote/${scholarship.id}`}>
                <Button size="sm" aria-label={`Vote for ${scholarship.title}`}>Vote Now</Button>
              </Link>
            )}
            {scholarship.status !== 'voting_open' && (
              <Link href={`/swb/vote/${scholarship.id}`}>
                <Button size="sm" variant="secondary" aria-label={`View ${scholarship.title}`}>View</Button>
              </Link>
            )}
          </>
        )}

        {role === 'student' && (
          <Link href={`/student/scholarship/${scholarship.id}`}>
            <Button size="sm" variant="secondary" aria-label={`View scholarship ${scholarship.title}`}>View Details</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
