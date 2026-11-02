'use client';

import { Nominee } from '@/types';
import { Trash2, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { TableSkeleton } from '@/components/ui/Skeleton';

interface NomineeListProps {
  nominees: Nominee[];
  loading?: boolean;
  canRemove?: boolean;
  onRemove?: (nomineeId: string) => void;
  onEdit?: (nominee: Nominee) => void;
}

export function NomineeList({ nominees, loading, canRemove, onRemove, onEdit }: NomineeListProps) {
  if (loading) {
    return <TableSkeleton rows={4} cols={7} />;
  }

  if (nominees.length === 0) {
    return (
      <div className="text-center py-8 text-smvitm-textSecondary">
        <p className="font-medium">No nominees added yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="List of nominees">
        <thead>
          <tr className="bg-smvitm-bg border-b border-smvitm-border">
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">#</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Student Name</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Roll No.</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Department</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Semester</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">CGPA</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Profile &amp; Extra Details</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold text-smvitm-textSecondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {nominees.map((nominee, idx) => (
            <tr key={nominee.id} className="border-b border-smvitm-border hover:bg-smvitm-bg/50 transition-colors">
              <td className="px-4 py-3 text-smvitm-textSecondary">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-smvitm-text">
                <div className="font-semibold text-slate-900">{nominee.studentName}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {nominee.caste && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-3xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {nominee.caste}
                    </span>
                  )}
                  {nominee.income ? (
                    <span className="inline-block px-1.5 py-0.5 rounded text-3xs font-mono font-medium bg-slate-100 text-slate-700">
                      ₹{Number(nominee.income).toLocaleString('en-IN')}
                    </span>
                  ) : null}
                  {nominee.prevScholarship && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-3xs font-medium bg-amber-100/70 text-amber-800">
                      Prev: {nominee.prevScholarship}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-smvitm-textSecondary font-mono">{nominee.rollNumber}</td>
              <td className="px-4 py-3 text-smvitm-textSecondary">
                {nominee.department && !nominee.department.startsWith('Cat:') && !nominee.department.startsWith('Category:') 
                  ? nominee.department 
                  : 'Regular B.E'}
              </td>
              <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.semester}</td>
              <td className="px-4 py-3">
                <span className="font-mono font-bold text-[#7B1436] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                  {(nominee.cgpa ?? 8.5).toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-smvitm-textSecondary max-w-sm">
                {nominee.description ? (
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-xs text-slate-800 font-medium leading-relaxed" title={nominee.description}>
                      {nominee.description}
                    </p>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(nominee)}
                        className="text-3xs text-[#7B1436] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <FileText size={10} /> Edit Extra Details
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="italic text-slate-400 text-xs block">No extra details yet</span>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(nominee)}
                        className="text-3xs text-[#C59048] font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        + Add Extra Details
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(nominee)}
                      className="text-2xs py-1 px-2.5 h-auto border-[#C59048] text-[#7B1436] hover:bg-[#FAF0F3] font-semibold gap-1 shadow-2xs"
                      aria-label={`Edit extra details for ${nominee.studentName}`}
                    >
                      <Edit3 size={12} />
                      <span>Edit Details</span>
                    </Button>
                  )}
                  {canRemove && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRemove?.(nominee.id)}
                      className="text-2xs py-1 px-2 h-auto"
                      aria-label={`Remove ${nominee.studentName} from nominees`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
