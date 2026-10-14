import { cn } from '@/lib/utils';
import { ScholarshipStatus } from '@/types';
import { formatStatus } from '@/lib/utils/formatters';

interface StatusChipProps {
  status: ScholarshipStatus;
  className?: string;
}

const statusStyles: Record<ScholarshipStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  published: 'bg-blue-50 text-blue-700 border-blue-300',
  voting_open: 'bg-amber-50 text-amber-700 border-amber-400',
  closed: 'bg-green-50 text-green-700 border-green-400',
};

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        statusStyles[status],
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
