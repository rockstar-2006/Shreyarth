'use client';

import { RankedNominee } from '@/lib/utils/computeResults';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface ResultsTableProps {
  rankings: RankedNominee[];
  isTied?: boolean;
  tiedNomineeIds?: string[];
  totalVoters: number;
  totalSWBMembers?: number;
}

export function ResultsTable({
  rankings,
  isTied,
  tiedNomineeIds = [],
  totalVoters,
  totalSWBMembers = 16,
}: ResultsTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="text-center py-8 text-smvitm-textSecondary">
        <p>No votes submitted yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-smvitm-textSecondary">
        <span className="font-semibold text-smvitm-text">{totalVoters} / {totalSWBMembers}</span> SWB members have voted
        {totalVoters < totalSWBMembers && (
          <span className="text-smvitm-warning font-medium ml-2">— Voting in progress</span>
        )}
      </div>

      {isTied && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-amber-800 font-medium">
          ⚠️ There is a tie between the top nominees. Admin must manually select the winner.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Scholarship results">
          <thead>
            <tr className="bg-smvitm-bg border-b border-smvitm-border">
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Rank</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Student Name</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Department</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Semester</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">CGPA</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Total Score</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-smvitm-textSecondary">Votes</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((nominee) => {
              const isWinner = nominee.rank === 1 && !isTied;
              const isTiedNominee = tiedNomineeIds.includes(nominee.nomineeId);
              return (
                <tr
                  key={nominee.nomineeId}
                  className={cn(
                    'border-b border-smvitm-border transition-colors',
                    isWinner && 'bg-smvitm-gold/10 border-smvitm-gold/40',
                    isTiedNominee && !isWinner && 'bg-amber-50'
                  )}
                  aria-label={isWinner ? `Winner: ${nominee.studentName}` : undefined}
                >
                  <td className="px-4 py-3">
                    {isWinner ? (
                      <span className="flex items-center gap-1 font-bold text-smvitm-gold">
                        <Trophy size={14} aria-hidden="true" />
                        1st
                      </span>
                    ) : (
                      <span className="text-smvitm-textSecondary">{nominee.rank}</span>
                    )}
                  </td>
                  <td className={cn('px-4 py-3 font-medium', isWinner ? 'text-smvitm-maroon font-bold' : 'text-smvitm-text')}>
                    {nominee.studentName}
                    {isWinner && <span className="ml-2 text-xs bg-smvitm-gold text-white px-1.5 py-0.5 rounded">Winner</span>}
                  </td>
                  <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.department}</td>
                  <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.semester}</td>
                  <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.cgpa.toFixed(2)}</td>
                  <td className={cn('px-4 py-3 font-bold text-lg', isWinner ? 'text-smvitm-gold' : 'text-smvitm-maroon')}>
                    {nominee.totalScore}
                  </td>
                  <td className="px-4 py-3 text-smvitm-textSecondary">{nominee.voteCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
