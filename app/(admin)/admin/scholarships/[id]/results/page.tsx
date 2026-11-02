'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScholarship, declareWinnerOnScholarship, listScholarships, resetScholarshipEvaluation } from '@/lib/firebase/firestore/scholarships';
import { listAllVotes, resetScholarshipVotes, resetSingleVote } from '@/lib/firebase/firestore/votes';
import { listNominees } from '@/lib/firebase/firestore/nominees';
import { listUsers } from '@/lib/firebase/firestore/users';
import { declareWinner as declareWinnerOnResult } from '@/lib/firebase/firestore/results';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { computeResults } from '@/lib/utils/computeResults';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Scholarship, Nominee, Vote, UserProfile } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Trophy, 
  ArrowLeft, 
  Filter, 
  CheckCircle2, 
  CheckSquare,
  Square,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showRoster, setShowRoster] = useState(true);

  // Caste Filter and Candidate Selection State
  const [selectedCaste, setSelectedCaste] = useState<string>('all');
  const [selectedAwardeeIds, setSelectedAwardeeIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getScholarship(id),
      listAllVotes(id),
      listNominees(id),
      listScholarships(),
      listUsers('swb_member'),
    ]).then(([s, v, n, allS, mList]) => {
      setScholarship(s);
      setVotes(v);
      setNominees(n);
      setAllScholarships(allS);
      setCommitteeMembers(mList);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      toast.error('Failed to load scholarship results');
      setLoading(false);
    });
  }, [id]);

  const handleResetAllVotes = async () => {
    setResetting(true);
    try {
      await resetScholarshipVotes(id);
      await resetScholarshipEvaluation(id);
      setVotes([]);
      setScholarship((prev) => prev ? { ...prev, status: 'voting_open', winnerId: null, winnerName: null } : prev);
      setShowResetModal(false);
      toast.success('All voting data has been reset! Committee members can cast fresh ratings.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset voting data.');
    } finally {
      setResetting(false);
    }
  };

  const handleResetSingleMember = async (memberUid: string, memberName: string) => {
    try {
      await resetSingleVote(id, memberUid);
      setVotes((prev) => prev.filter((v) => v.swbMemberId !== memberUid));
      toast.success(`Reset rating for ${memberName}. They can now re-vote.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset member vote.');
    }
  };

  // Map each committee member to their vote status for this scholarship
  const memberVoteStatus = useMemo(() => {
    return committeeMembers.map((member, idx) => {
      const vote = votes.find(
        (v) => v.swbMemberId === member.uid || 
        v.swbMemberName?.toLowerCase() === member.name?.toLowerCase()
      );
      const hasVoted = Boolean(vote && vote.isSubmitted);
      const ratedCount = vote ? Object.keys(vote.ratings || {}).length : 0;
      return {
        member,
        hasVoted,
        vote,
        ratedCount,
        slNo: member.slNo || idx + 1,
      };
    });
  }, [committeeMembers, votes]);

  const votedCount = memberVoteStatus.filter((m) => m.hasVoted).length;
  const totalCommitteeCount = committeeMembers.length;

  const results = useMemo(() => computeResults(votes, nominees), [votes, nominees]);

  // Distinct castes from the nominees
  const distinctCastes = useMemo(() => {
    const set = new Set<string>();
    results.rankings.forEach((r) => {
      if (r.caste) set.add(r.caste);
    });
    return Array.from(set).sort();
  }, [results.rankings]);

  // Filtered rankings based on chosen caste
  const filteredRankings = useMemo(() => {
    if (selectedCaste === 'all') return results.rankings;
    return results.rankings.filter((r) => r.caste.toLowerCase() === selectedCaste.toLowerCase());
  }, [results.rankings, selectedCaste]);

  // Top 6 Students (by total faculty score)
  const top6Students = useMemo(() => {
    return results.rankings.slice(0, 6);
  }, [results.rankings]);

  // Auto-select top candidates initially if none selected
  useEffect(() => {
    if (top6Students.length > 0 && selectedAwardeeIds.length === 0) {
      // Default select the top ranker
      setSelectedAwardeeIds([top6Students[0].nomineeId]);
    }
  }, [top6Students, selectedAwardeeIds.length]);

  const toggleSelectAwardee = (nomineeId: string) => {
    setSelectedAwardeeIds((prev) => 
      prev.includes(nomineeId) ? prev.filter((id) => id !== nomineeId) : [...prev, nomineeId]
    );
  };

  const selectTop6 = () => {
    setSelectedAwardeeIds(top6Students.map((s) => s.nomineeId));
    toast.success('Selected all Top 6 students!');
  };

  const handleConfirmAwards = async () => {
    if (selectedAwardeeIds.length === 0) {
      toast.error('Please select at least one student to award.');
      return;
    }

    const awardees = nominees.filter((n) => selectedAwardeeIds.includes(n.studentId));
    const awardeeNames = awardees.map((a) => a.studentName).join(', ');

    setDeclaring(true);
    try {
      await declareWinnerOnResult(
        id,
        selectedAwardeeIds[0],
        awardeeNames,
        Object.fromEntries(results.rankings.map((r) => [r.nomineeId, r.totalScore])),
        results.rankings.map((r) => r.nomineeId),
        user?.uid ?? ''
      );
      await declareWinnerOnScholarship(id, selectedAwardeeIds[0], awardeeNames);
      toast.success(`🏆 Successfully declared ${awardees.length} Scholarship Awardee(s)!`);
      setShowAwardModal(false);
      setScholarship((prev) => prev ? { ...prev, winnerId: selectedAwardeeIds[0], winnerName: awardeeNames, status: 'closed' } : prev);
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm awardees. Please try again.');
    } finally {
      setDeclaring(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6 animate-fade-in">
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl border border-[#E2D9CE] p-8 shadow-card">
        <p className="text-smvitm-textSecondary text-sm mb-4">Scholarship evaluation results not found.</p>
        <Link href="/admin/scholarships">
          <Button variant="secondary">Back to Scholarships</Button>
        </Link>
      </div>
    );
  }

  const selectedAwardeesDetails = results.rankings.filter((r) => selectedAwardeeIds.includes(r.nomineeId));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-fade-in">
      
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2D9CE]">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/scholarships/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-smvitm-maroon hover:bg-[#FAF0F3] border border-[#C59048]/30">
              <ArrowLeft size={16} /> Scheme Docket
            </Button>
          </Link>
          <span className="text-xs text-smvitm-textSecondary font-mono hidden sm:inline">/ Committee Evaluation Results</span>

          {/* Scheme Selector Dropdown */}
          {allScholarships.length > 1 && (
            <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E2D9CE] px-3 py-1 rounded-xl shadow-xs">
              <label htmlFor="scheme-select" className="text-[11px] font-bold text-[#7B1436] uppercase tracking-wider">
                Switch Scheme:
              </label>
              <select
                id="scheme-select"
                value={id}
                onChange={(e) => router.push(`/admin/scholarships/${e.target.value}/results`)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-xs truncate"
              >
                {allScholarships.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.academicYear})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            {votedCount} of {totalCommitteeCount} Members Voted
          </span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowResetModal(true)}
            className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RotateCcw size={13} /> Reset Voting
          </Button>

          <Button 
            onClick={() => setShowAwardModal(true)} 
            disabled={selectedAwardeeIds.length === 0}
            className="bg-[#7B1436] hover:bg-[#5A0F28] text-white font-heading font-bold text-xs sm:text-sm px-4 py-2 gap-2 shadow-md"
          >
            <Trophy size={16} className="text-[#F3DE98]" />
            <span>Confirm Awardees ({selectedAwardeeIds.length})</span>
          </Button>
        </div>
      </div>

      {/* ─── Winner Banner (If already declared) ─── */}
      {scholarship.winnerName && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-[#122147] text-white p-6 shadow-xl border-2 border-emerald-400/60 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#F3DE98] text-xs font-mono uppercase tracking-wider">
                <Trophy size={16} />
                <span>OFFICIALLY CONFERRED SCHOLARSHIP AWARDEES</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {scholarship.winnerName}
              </h2>
              <p className="text-white/80 text-xs">
                Conferred during Annual College Day celebrations • Grant: {formatCurrency(scholarship.amount)} per student
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
              <span className="text-2xs text-[#F3DE98] uppercase font-bold block">Status</span>
              <span className="font-heading text-lg font-bold text-white">Awarded &amp; Finalized</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Summary Stats Ribbon ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
          <span className="text-2xs font-semibold uppercase text-slate-500 block">Total Evaluated Nominees</span>
          <span className="font-heading text-2xl font-bold text-[#7B1436] mt-1 block">{nominees.length}</span>
          <span className="text-2xs text-slate-500">Candidates in docket</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
          <span className="text-2xs font-semibold uppercase text-slate-500 block">Faculty Evaluators</span>
          <span className="font-heading text-2xl font-bold text-[#C59048] mt-1 block">{results.totalVoters}</span>
          <span className="text-2xs text-slate-500">Committee votes counted</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
          <span className="text-2xs font-semibold uppercase text-slate-500 block">Highest Committee Score</span>
          <span className="font-heading text-2xl font-bold text-emerald-700 mt-1 block">
            {results.rankings[0]?.totalScore ?? 0}
          </span>
          <span className="text-2xs text-slate-500">
            Avg: {results.rankings[0]?.averageRating ?? 0} / 10
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
          <span className="text-2xs font-semibold uppercase text-slate-500 block">Selected for Award</span>
          <span className="font-heading text-2xl font-bold text-[#122147] mt-1 block">{selectedAwardeeIds.length}</span>
          <span className="text-2xs text-slate-500">
            Total: {formatCurrency(scholarship.amount * selectedAwardeeIds.length)}
          </span>
        </div>
      </div>

      {/* ─── Committee Voting Participation & Member Roster Panel ─── */}
      <Card accent>
        <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <UserCheck className="text-[#7B1436]" size={18} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-[#7B1436] text-base">
                  Committee Member Voting Roster &amp; Status
                </h2>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {votedCount} of {totalCommitteeCount} Members Voted
                </span>
              </div>
              <p className="text-2xs text-[#8A7E82]">
                Track which faculty members have submitted ratings and reset their votes if needed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRoster((p) => !p)}
              className="text-xs text-[#7B1436] hover:bg-white font-semibold gap-1"
            >
              {showRoster ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span>{showRoster ? 'Hide Member Roster' : 'View Member Roster'}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowResetModal(true)}
              className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1"
            >
              <RotateCcw size={13} /> Reset All Votes
            </Button>
          </div>
        </CardHeader>

        {showRoster && (
          <CardBody className="p-0">
            {/* Progress Participation Bar */}
            <div className="px-6 py-3 bg-[#FFFDF9] border-b border-[#E2D9CE] flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-2xs mb-1">
                  <span className="font-bold text-[#7B1436] uppercase tracking-wider">
                    Committee Voting Completion Progress
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {Math.round((votedCount / (totalCommitteeCount || 1)) * 100)}% ({votedCount}/{totalCommitteeCount} Members Voted)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C59048] to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((votedCount / (totalCommitteeCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#8A7E82] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4 w-12 text-center">Sl No</th>
                    <th className="py-2.5 px-4 min-w-[180px]">Faculty Member Name</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Designation &amp; Department</th>
                    <th className="py-2.5 px-4 min-w-[180px]">Mail Id</th>
                    <th className="py-2.5 px-4 text-center min-w-[170px]">Voting Status</th>
                    <th className="py-2.5 px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D9]">
                  {memberVoteStatus.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        No committee members registered in database. Upload committee Excel on Users page.
                      </td>
                    </tr>
                  ) : (
                    memberVoteStatus.map((item) => (
                      <tr key={item.member.uid} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-500">
                          {item.slNo}
                        </td>
                        <td className="py-3 px-4 font-semibold text-smvitm-text">
                          {item.member.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#7B1436] block">
                            {item.member.designation || 'Committee Member'}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {item.member.department}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#7B1436]">
                          <a href={`mailto:${item.member.email}`} className="hover:underline">
                            {item.member.email}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.hasVoted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px]">
                              <CheckCircle2 size={13} className="text-emerald-700" />
                              <span>Ratings Submitted ({item.ratedCount} rated)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[11px]">
                              <Clock size={13} className="text-amber-700" />
                              <span>Rating Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.hasVoted ? (
                            <button
                              type="button"
                              onClick={() => handleResetSingleMember(item.member.uid, item.member.name)}
                              className="px-2.5 py-1 rounded-lg text-2xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-50 flex items-center gap-1 mx-auto transition-colors"
                              title="Reset this member's ratings so they can re-rate"
                            >
                              <RotateCcw size={11} />
                              <span>Reset Vote</span>
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        )}
      </Card>

      {/* ─── 🏆 TOP 6 DESERVING STUDENTS SPOTLIGHT ─── */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white rounded-3xl border-2 border-[#C59048] p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CE]">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-[#C59048]" />
              <h2 className="font-heading text-xl font-bold text-[#7B1436]">
                Top 6 Deserving Students (Leaderboard)
              </h2>
            </div>
            <p className="text-xs text-smvitm-textSecondary mt-0.5">
              Highest rated candidates out of 10 compiled across all faculty committee members.
            </p>
          </div>

          <button
            type="button"
            onClick={selectTop6}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#7B1436] border border-[#C59048] text-xs font-heading font-bold shadow-xs transition-all"
          >
            <CheckSquare size={14} className="text-[#C59048]" />
            <span>Select All Top 6</span>
          </button>
        </div>

        {/* Top 6 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {top6Students.map((student) => {
            const isSelected = selectedAwardeeIds.includes(student.nomineeId);
            const income = Number(student.income);
            const rankMedalColor = 
              student.rank === 1 ? 'bg-amber-500 text-white' :
              student.rank === 2 ? 'bg-slate-400 text-white' :
              student.rank === 3 ? 'bg-amber-700 text-white' :
              'bg-[#FAF0F3] text-[#7B1436] border border-[#7B1436]/20';

            return (
              <div
                key={student.nomineeId}
                onClick={() => toggleSelectAwardee(student.nomineeId)}
                className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all duration-200 relative flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-amber-50/60 border-[#C59048] shadow-md ring-2 ring-[#C59048]/40 scale-[1.01]' 
                    : 'bg-white border-[#E2D9CE] hover:border-[#C59048] shadow-xs'
                }`}
              >
                <div>
                  {/* Top Rank Badge & Selection Checkbox */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`w-7 h-7 rounded-xl font-heading font-bold text-xs flex items-center justify-center shadow-xs ${rankMedalColor}`}>
                      #{student.rank}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-2xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ⭐ {student.averageRating} / 10
                      </span>
                      {isSelected ? (
                        <CheckSquare size={18} className="text-[#7B1436]" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Student Name */}
                  <h3 className="font-heading text-base font-bold text-[#18181B] line-clamp-1">
                    {student.studentName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    USN: {student.rollNumber}
                  </p>

                  {/* Caste Tag & Meta Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-[#FAF0F3] text-[#7B1436] border border-[#7B1436]/20">
                      Caste: {student.caste}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700">
                      CGPA: {student.cgpa.toFixed(2)}
                    </span>
                    {Number.isFinite(income) && income > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-700">
                        {formatCurrency(income)}
                      </span>
                    )}
                  </div>

                  {/* Profile / Extra Details */}
                  {student.description && (
                    <p className="text-3xs text-slate-700 line-clamp-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80 leading-relaxed font-medium" title={student.description}>
                      <span className="font-bold text-[#7B1436]">Profile:</span> {student.description}
                    </p>
                  )}
                </div>

                {/* Score breakdown footer */}
                <div className="pt-3 mt-3 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs">
                  <span className="text-slate-500">
                    {student.voteCount} faculty votes
                  </span>
                  <span className="font-bold text-[#7B1436] text-xs">
                    Score: {student.totalScore} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CASTE CATEGORY SELECTOR & FILTER TABS ─── */}
      <div className="bg-white rounded-2xl border border-[#E2D9CE] p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-bold text-[#7B1436] flex items-center gap-2">
              <Filter size={16} className="text-[#C59048]" />
              Select &amp; Filter Candidates by Caste / Category
            </h3>
            <p className="text-xs text-smvitm-textSecondary mt-0.5">
              Review candidates filtered by their reservation category to award deserving students across categories.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Showing: <strong>{filteredRankings.length}</strong> student(s)
          </div>
        </div>

        {/* Caste Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCaste('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all ${
              selectedCaste === 'all'
                ? 'bg-[#7B1436] text-white shadow-sm'
                : 'bg-[#FAF8F5] text-slate-700 hover:bg-[#FAF0F3] border border-[#E2D9CE]'
            }`}
          >
            All Categories ({results.rankings.length})
          </button>

          {distinctCastes.map((caste) => {
            const count = results.rankings.filter((r) => r.caste.toLowerCase() === caste.toLowerCase()).length;
            const isSelected = selectedCaste.toLowerCase() === caste.toLowerCase();
            return (
              <button
                key={caste}
                type="button"
                onClick={() => setSelectedCaste(caste)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all ${
                  isSelected
                    ? 'bg-[#C59048] text-white shadow-sm'
                    : 'bg-[#FAF8F5] text-slate-700 hover:bg-[#FAF0F3] border border-[#E2D9CE]'
                }`}
              >
                <span>{caste}</span>
                <span className="ml-1.5 text-2xs opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Rankings Table with Caste & Score */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left" role="table">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E2D9CE] text-slate-700">
                <th className="px-3 py-3 w-10 text-center font-bold">Select</th>
                <th className="px-3 py-3 w-12 text-center font-bold">Rank</th>
                <th className="px-4 py-3 font-bold">Student Name</th>
                <th className="px-3 py-3 font-bold">USN</th>
                <th className="px-3 py-3 font-bold">Caste / Category</th>
                <th className="px-3 py-3 text-center font-bold">CGPA</th>
                <th className="px-3 py-3 text-center font-bold">Avg Rating</th>
                <th className="px-3 py-3 text-right font-bold">Total Score</th>
                <th className="px-3 py-3 text-center font-bold">Votes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9CE]/60">
              {filteredRankings.map((nominee) => {
                const isSelected = selectedAwardeeIds.includes(nominee.nomineeId);
                const isTop6 = nominee.rank <= 6;

                return (
                  <tr 
                    key={nominee.nomineeId}
                    onClick={() => toggleSelectAwardee(nominee.nomineeId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-amber-50/80' 
                        : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectAwardee(nominee.nomineeId)}
                        className="rounded text-[#7B1436] focus:ring-[#7B1436] cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-lg text-2xs ${
                        nominee.rank === 1 ? 'bg-amber-500 text-white' :
                        nominee.rank <= 3 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        isTop6 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'text-slate-600'
                      }`}>
                        #{nominee.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="font-heading font-bold text-xs sm:text-sm">
                        {nominee.studentName}
                      </div>
                      <div className="text-2xs text-slate-500">
                        {nominee.department}
                      </div>
                      {nominee.description && (
                        <div className="text-3xs text-slate-600 line-clamp-1 italic max-w-xs mt-0.5" title={nominee.description}>
                          {nominee.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-700">
                      {nominee.rollNumber}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-[#FAF0F3] text-[#7B1436] border border-[#7B1436]/20">
                        {nominee.caste}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-800">
                      {nominee.cgpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ⭐ {nominee.averageRating}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-heading font-bold text-sm text-[#7B1436]">
                      {nominee.totalScore}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-500 font-mono">
                      {nominee.voteCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Faculty Evaluators Participation List ─── */}
      <div className="bg-white rounded-2xl border border-[#E2D9CE] p-5 shadow-card space-y-3">
        <h3 className="font-heading text-base font-bold text-[#18181B] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#C59048]" />
          Participating Committee Evaluators ({votes.length})
        </h3>
        {votes.length === 0 ? (
          <p className="text-xs text-smvitm-textSecondary italic">
            No faculty members have cast evaluations yet. When faculty rate candidates out of 10, their records appear here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {votes.map((v) => (
              <div key={v.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{v.swbMemberName || 'Faculty Member'}</p>
                  <p className="text-2xs text-slate-500">Evaluated {Object.keys(v.ratings || {}).length} candidates</p>
                </div>
                <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Submitted
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Confirm Award Declaration Modal ─── */}
      <Modal
        isOpen={showAwardModal}
        onClose={() => setShowAwardModal(false)}
        title="Confirm Scholarship Awardees"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setShowAwardModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAwards} 
              isLoading={declaring}
              className="bg-[#7B1436] hover:bg-[#5A0F28] text-white font-heading font-bold"
            >
              <Trophy size={16} className="mr-2 text-[#F3DE98]" />
              Confirm &amp; Award {selectedAwardeeIds.length} Student(s)
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-smvitm-textSecondary leading-relaxed">
            You are about to declare the following <strong>{selectedAwardeeIds.length}</strong> selected student(s) as the official recipients of the <strong>{scholarship.title}</strong>:
          </p>

          <div className="divide-y divide-[#E2D9CE] max-h-60 overflow-y-auto border border-[#E2D9CE] rounded-xl bg-[#FAF8F5]">
            {selectedAwardeesDetails.map((student) => (
              <div key={student.nomineeId} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#18181B] font-heading">{student.studentName}</p>
                  <p className="text-2xs text-slate-500">USN: {student.rollNumber} • Caste: {student.caste}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#7B1436]">{formatCurrency(scholarship.amount)}</span>
                  <p className="text-2xs text-emerald-700 font-semibold">Score: {student.totalScore} pts</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-2xs text-amber-900 leading-relaxed">
            <strong>Grant Summary:</strong> Each student will receive <strong>{formatCurrency(scholarship.amount)}</strong> during College Day celebrations. Total institutional grant: <strong>{formatCurrency(scholarship.amount * selectedAwardeeIds.length)}</strong>.
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Reset Voting Confirmation ─── */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Scholarship Voting & Ratings"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResetModal(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetAllVotes} isLoading={resetting}>
              Confirm Reset All Votes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <AlertTriangle size={20} className="text-rose-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Warning: This action will clear all submitted ratings</strong>
              <p className="leading-relaxed">
                All <strong>{votes.length} submitted evaluation vote(s)</strong> for <em>{scholarship.title}</em> will be deleted from the database. Committee members will be able to log in and cast fresh 1-to-10 ratings.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            If any winners were previously confirmed, the award status will also be reopened for voting.
          </p>
        </div>
      </Modal>

      {/* ─── Bottom Floating Selection Summary Bar ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-[#C59048]/40 py-3.5 px-6 z-30 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#FAF0F3] text-[#7B1436] font-heading font-bold text-sm flex items-center justify-center border border-[#7B1436]/20">
              {selectedAwardeeIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {selectedAwardeeIds.length} Student(s) Selected for Scholarship
              </p>
              <p className="text-2xs text-slate-500">
                Filter by Caste / Category above to balance representation across reservation quotas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setShowAwardModal(true)} 
              disabled={selectedAwardeeIds.length === 0}
              className="w-full sm:w-auto bg-[#7B1436] hover:bg-[#5A0F28] text-white font-heading font-bold text-xs sm:text-sm px-6 py-2.5 shadow-md"
            >
              <Trophy size={15} className="mr-2 text-[#F3DE98]" />
              Finalize Awards ({selectedAwardeeIds.length})
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
