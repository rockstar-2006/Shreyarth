'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScholarships } from '@/lib/hooks/useScholarships';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getVote } from '@/lib/firebase/firestore/votes';
import { listNominees } from '@/lib/firebase/firestore/nominees';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';
import { 
  Award, 
  Star, 
  Building2, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Calendar,
  UserCheck,
  Lock,
  Edit3
} from 'lucide-react';

interface ScholarshipStatusMap {
  hasVoted: boolean;
  ratedCount: number;
  totalNominees: number;
}

export default function SWBDashboardPage() {
  const { user } = useAuthContext();
  const { scholarships, loading } = useScholarships();
  const [voteStatuses, setVoteStatuses] = useState<Record<string, ScholarshipStatusMap>>({});

  // Any published or voting-open scholarship is available for faculty rating
  const activeScholarships = useMemo(
    () => scholarships.filter((s) => s.status === 'published' || s.status === 'voting_open'),
    [scholarships]
  );

  const completedScholarships = scholarships.filter(
    (s) => s.status === 'closed'
  );

  // Check isolated vote status for this specific faculty member
  useEffect(() => {
    if (!user || activeScholarships.length === 0) return;

    let isMounted = true;

    const checkStatuses = async () => {
      const map: Record<string, ScholarshipStatusMap> = {};
      for (const s of activeScholarships) {
        try {
          const [vote, nominees] = await Promise.all([
            getVote(s.id, user.uid),
            listNominees(s.id),
          ]);
          const hasVoted = vote !== null && vote.isSubmitted;
          const ratedCount = vote ? Object.keys(vote.ratings || {}).filter((k) => vote.ratings[k] > 0).length : 0;
          map[s.id] = {
            hasVoted,
            ratedCount,
            totalNominees: nominees.length,
          };
        } catch {
          map[s.id] = { hasVoted: false, ratedCount: 0, totalNominees: 0 };
        }
      }
      if (isMounted) {
        setVoteStatuses(map);
      }
    };

    checkStatuses();

    return () => {
      isMounted = false;
    };
  }, [user, activeScholarships]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* ─── Faculty Header Banner ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white p-6 shadow-xl border border-[#C59048]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#F3DE98] text-[11px] font-mono border border-[#C59048]/30">
              <UserCheck size={13} className="text-[#C59048]" />
              <span>FACULTY EVALUATION COMMITTEE</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-white/70 text-xs sm:text-sm">
              {user?.department ? `${user.department} Department • ` : ''}
              {user?.designation || 'Faculty Committee Member'} • SMVITM Student Welfare Board
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-[#F3DE98]/30 rounded-xl px-4 py-3 text-center sm:text-right flex-shrink-0">
            <span className="text-[10px] text-[#F3DE98] font-bold uppercase tracking-wider block">
              Active Evaluation Schemes
            </span>
            <span className="font-heading text-2xl font-bold text-white">
              {activeScholarships.length}
            </span>
          </div>
        </div>
      </div>

      {/* ─── ISOLATED RATING PROTOCOL NOTICE ─── */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#C59048]/40 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#7B1436] flex-shrink-0 mt-0.5">
          <Lock size={18} />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-heading font-bold text-xs sm:text-sm text-[#7B1436] flex items-center gap-1.5">
            <span>Isolated Blind Evaluation Protocol Active</span>
            <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
              Confidential
            </span>
          </h4>
          <p className="text-xs text-smvitm-textSecondary leading-relaxed">
            In accordance with the SMVITM Student Welfare Board charter, your individual student ratings out of 10 are strictly 
            isolated and private. Faculty evaluators cannot view each other&apos;s scores. All committee ratings are independently compiled 
            by the institutional tally system.
          </p>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <>
          {/* ─── Active Scholarships Available For Rating ─── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-[#C59048] fill-[#C59048]" />
                <h2 className="font-heading text-lg font-bold text-[#7B1436]">
                  Scholarships Open for Faculty Rating
                </h2>
                <Badge variant="gold">{activeScholarships.length}</Badge>
              </div>
              <span className="text-2xs text-slate-500 font-mono">
                Academic Year 2025–26
              </span>
            </div>

            {activeScholarships.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12 text-smvitm-textSecondary">
                  <Clock size={36} className="mx-auto mb-2 text-[#C59048] opacity-60" />
                  <p className="text-base font-semibold mb-1">No Scholarships Currently Open for Rating</p>
                  <p className="text-xs">
                    When the administrator publishes a scholarship scheme, it will appear here immediately with candidate details and a rating button.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {activeScholarships.map((s) => {
                  const status = voteStatuses[s.id];
                  const hasVoted = status?.hasVoted;
                  const ratedCount = status?.ratedCount ?? 0;
                  const totalNominees = status?.totalNominees ?? 0;

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl border-2 border-[#C59048]/40 shadow-card hover:shadow-cardHover transition-all duration-200 overflow-hidden flex flex-col group"
                    >
                      {/* Top status bar */}
                      <div className="bg-gradient-to-r from-[#7B1436] to-[#122147] text-white px-5 py-2.5 flex items-center justify-between text-xs">
                        <span className="font-mono text-2xs uppercase tracking-wider text-[#F3DE98] font-bold">
                          OPEN FOR FACULTY RATING
                        </span>
                        <span className="flex items-center gap-1 text-2xs text-white/80">
                          <Calendar size={12} className="text-[#C59048]" /> A.Y. {s.academicYear}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="font-heading text-lg font-bold text-[#18181B] group-hover:text-[#7B1436] transition-colors line-clamp-2">
                              {s.title}
                            </h3>
                          </div>

                          <p className="text-xs text-smvitm-textSecondary line-clamp-2 leading-relaxed">
                            {s.purpose || s.description}
                          </p>
                        </div>

                        {/* Individual Faculty Progress Badge */}
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Your Rating Status:</span>
                          {hasVoted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Ratings Submitted ({ratedCount})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Clock size={13} className="text-amber-600" />
                              <span>Rating Pending ({ratedCount}/{totalNominees})</span>
                            </span>
                          )}
                        </div>

                        {/* Meta badges */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2D9CE]/60 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Award size={14} className="text-[#7B1436]" />
                            <span className="font-bold text-[#7B1436]">{formatCurrency(s.amount)}</span>
                            <span className="text-2xs text-slate-500">/ student</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 truncate text-2xs">
                            <Building2 size={13} className="text-[#C59048] flex-shrink-0" />
                            <span className="truncate">{s.sponsorName || 'SMVITM Trust'}</span>
                          </div>
                        </div>

                        {/* Big Rating Action Button */}
                        <Link href={`/swb/vote/${s.id}`} className="block w-full pt-1">
                          <button
                            type="button"
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] group/btn ${
                              hasVoted
                                ? 'bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950'
                                : 'bg-gradient-to-r from-[#7B1436] to-[#991B1E] hover:from-[#5A0F28] hover:to-[#7B1436]'
                            }`}
                          >
                            {hasVoted ? (
                              <>
                                <Edit3 size={16} className="text-[#F3DE98]" />
                                <span>Review / Update Candidate Ratings</span>
                              </>
                            ) : (
                              <>
                                <Star size={16} className="text-[#F3DE98] fill-[#F3DE98]" />
                                <span>Start Rating Candidates</span>
                              </>
                            )}
                            <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform ml-1" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Past / Concluded Scholarships ─── */}
          {completedScholarships.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-[#E2D9CE]">
              <h2 className="font-heading text-base font-bold text-slate-700">
                Completed Scholarship Evaluations ({completedScholarships.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {completedScholarships.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-[#E2D9CE] p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{s.title}</h4>
                      <p className="text-2xs text-slate-500 mt-0.5">Winner: {s.winnerName || 'Declared'}</p>
                    </div>
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Concluded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
