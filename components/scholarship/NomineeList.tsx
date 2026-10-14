'use client';

import { Nominee } from '@/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface NomineeListProps {
  nominees: Nominee[];
  loading?: boolean;
  canRemove?: boolean;
  onRemove?: (nomineeId: string) => void;
}

export function NomineeList({ nominees, loading, canRemove, onRemove }: NomineeListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
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
            {canRemove && <th scope="col" className="px-4 py-3" aria-label="Actions"></th>}
          </tr>
        </thead>
        <tbody>
          {nominees.map((nominee, idx) => (
            <tr key={nominee.id} className="border-b border-smvitm-border hover:bg-smvitm-bg/50 transition-colors">
              <td className="px-4 py-3 text-smvitm-textSecondary">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-smvitm-text">{nominee.studentName}</td>
              <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.rollNumber}</td>
              <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.department}</td>
              <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.semester}</td>
              <td className="px-4 py-3">
                <span className="font-semibold text-smvitm-maroon">{nominee.cgpa.toFixed(2)}</span>
              </td>
              {canRemove && (
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRemove?.(nominee.id)}
                    aria-label={`Remove ${nominee.studentName} from nominees`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
