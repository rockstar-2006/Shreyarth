import { cn } from '@/lib/utils';
import { ScholarshipStatus } from '@/types';
import { formatStatus } from '@/lib/utils/formatters';

interface StatusChipProps {
  status: ScholarshipStatus;
  className?: string;
}

const statusStyles: Record<ScholarshipStatus, { pill: string; dot: string }> = {
  draft:       { pill: 'bg-smvitm-bgAlt    text-smvitm-textSecondary',  dot: 'bg-smvitm-textMuted' },
  published:   { pill: 'bg-smvitm-infoBg   text-smvitm-info',            dot: 'bg-smvitm-info' },
  voting_open: { pill: 'bg-smvitm-goldFaint text-smvitm-gold',            dot: 'bg-smvitm-gold animate-pulse' },
  closed:      { pill: 'bg-smvitm-successBg text-smvitm-success',        dot: 'bg-smvitm-success' },
};

export function StatusChip({ status, className }: StatusChipProps) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold whitespace-nowrap',
        s.pill,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', s.dot)} />
      {formatStatus(status)}
    </span>
  );
}
