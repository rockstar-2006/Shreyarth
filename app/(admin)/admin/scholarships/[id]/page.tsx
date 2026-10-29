'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScholarship, publishScholarship, openVoting, closeVoting, resetScholarshipEvaluation } from '@/lib/firebase/firestore/scholarships';
import { listAllVotes, resetScholarshipVotes } from '@/lib/firebase/firestore/votes';
import { listUsers } from '@/lib/firebase/firestore/users';
import { Scholarship, Vote, UserProfile } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Award, 
  Users, 
  ArrowLeft, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Percent, 
  Vote as VoteIcon,
  Clock,
  ArrowRight,
  Edit,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

export default function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getScholarship(id),
      listAllVotes(id),
      listUsers('swb_member'),
    ]).then(([s, vList, mList]) => {
      setScholarship(s);
      setVotes(vList);
      setCommitteeMembers(mList);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      toast.error('Failed to load scheme details');
      setLoading(false);
    });
  }, [id]);

  const handleResetAllVotes = async () => {
    setActionLoading(true);
    try {
      await resetScholarshipVotes(id);
      await resetScholarshipEvaluation(id);
      setVotes([]);
      setScholarship((prev) => prev ? { ...prev, status: 'voting_open', winnerId: null, winnerName: null } : prev);
      setShowResetModal(false);
      toast.success('All votes have been reset! Committee members can vote fresh.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset votes.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await publishScholarship(id);
      toast.success('Scholarship published! Committee members can now view and prepare.');
      setScholarship((prev) => prev ? { ...prev, status: 'published' } : prev);
    } catch {
      toast.error('Failed to publish. Please check nominees.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVoting = async () => {
    setActionLoading(true);
    try {
      await openVoting(id);
      toast.success('Voting is now open for SWB members!');
      setScholarship((prev) => prev ? { ...prev, status: 'voting_open' } : prev);
    } catch {
      toast.error('Failed to open voting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    setActionLoading(true);
    try {
      await closeVoting(id);
      toast.success('Voting closed! Results calculated.');
      router.push(`/admin/scholarships/${id}/results`);
    } catch {
      toast.error('Failed to close voting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-2 py-4 space-y-6 animate-fade-in">
        <div className="flex justify-between items-center pb-4 border-b border-[#E2D9CE]">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="bg-white rounded-2xl border-2 border-[#C59048]/30 p-6 space-y-6 shadow-card">
          <div className="space-y-3">
            <Skeleton className="h-5 w-48 rounded-full" />
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-4 gap-4 py-4 border-y border-[#E2D9CE]/60">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl border border-[#E2D9CE] p-8 shadow-card">
        <Award size={48} className="text-[#C59048] mx-auto mb-3 opacity-60" />
        <h2 className="font-heading text-xl font-bold text-smvitm-maroon mb-2">Scholarship Scheme Not Found</h2>
        <p className="text-smvitm-textSecondary text-sm mb-6">The requested scholarship scheme does not exist or may have been removed.</p>
        <Link href="/admin/scholarships">
          <Button variant="secondary" className="inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Scholarships List
          </Button>
        </Link>
      </div>
    );
  }

  const isDraft = scholarship.status === 'draft';
  const isPublished = scholarship.status === 'published';
  const isVotingOpen = scholarship.status === 'voting_open';
  const isClosed = scholarship.status === 'closed';

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 animate-fade-in space-y-6">
      
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2D9CE]">
        <div className="flex items-center gap-3">
          <Link href="/admin/scholarships">
            <Button variant="ghost" size="sm" className="gap-1.5 text-smvitm-maroon hover:bg-[#FAF0F3] border border-[#C59048]/30">
              <ArrowLeft size={16} /> All Schemes
            </Button>
          </Link>
          <span className="text-xs text-smvitm-textSecondary font-mono">/ Scheme #{id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/admin/scholarships/${id}/edit`}>
            <Button variant="secondary" size="sm" className="gap-1.5 border-[#C59048] text-[#7B1436] hover:bg-[#FAF0F3] font-semibold">
              <Edit size={14} /> Edit Scheme / Fields
            </Button>
          </Link>
          <StatusChip status={scholarship.status} />
          {isDraft && (
            <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Draft Mode
            </span>
          )}
        </div>
      </div>

      {/* ─── DRAFT STATUS BANNER (When Scheme is in Draft) ─── */}
      {isDraft && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70 border-2 border-amber-300/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-amber-950 text-base">This Scholarship is in Draft Status</h3>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed mt-1 max-w-xl">
                  Candidates have not been published for committee voting yet. You can edit scheme criteria, assign student nominees from the 
                  Student Database, review committee members, and publish whenever you are ready.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
              <Link href={`/admin/scholarships/${id}/edit`}>
                <Button variant="secondary" size="sm" className="gap-1.5 bg-white border-amber-300 text-amber-900 font-semibold shadow-xs">
                  <Edit size={14} /> Edit Draft
                </Button>
              </Link>
              <Link href={`/admin/scholarships/${id}/nominees`} className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto gap-2 bg-white hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm font-semibold">
                  <Users size={15} /> Assign Nominees
                </Button>
              </Link>
              <Button 
                onClick={handlePublish} 
                isLoading={actionLoading} 
                size="sm" 
                className="w-full sm:w-auto gap-1.5 bg-[#7B1436] hover:bg-[#5A0F28] text-white shadow-sm font-semibold"
              >
                Publish Scheme →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN SCHOLARSHIP CARD (Traditional Shreyarth Design) ─── */}
      <div className="bg-white rounded-2xl border-2 border-[#C59048]/40 shadow-card overflow-hidden">
        
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-[#7B1436] via-[#5A0F28] to-[#122147] p-6 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xs font-mono tracking-widest text-[#E8B84B] uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                  SMVITM SCHOLARSHIP SCHEME
                </span>
                <span className="text-xs text-white/70 font-serif">
                  ಶ್ರೇಯಾರ್ಥ · ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ ವಿವರ
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                {scholarship.title}
              </h1>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-2">
                <Building2 size={13} className="text-[#E8B84B]" />
                Shri Madhwa Vadiraja Institute of Technology &amp; Management, Bantakal
              </p>
            </div>

            {/* Award Amount Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-[#E8B84B]/40 rounded-xl px-5 py-3.5 text-center flex-shrink-0">
              <span className="text-[11px] text-[#E8B84B] uppercase tracking-wider font-semibold block">Grant Amount</span>
              <span className="font-heading text-2xl font-bold text-white">{formatCurrency(scholarship.amount)}</span>
              <span className="text-2xs text-white/70 block mt-0.5">Per selected student</span>
            </div>
          </div>
        </div>

        {/* Quick Meta Ribbon */}
        <div className="bg-[#FAF7F2] border-b border-[#E2D9CE] px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-smvitm-textSecondary block text-2xs uppercase tracking-wider font-medium">Academic Year</span>
            <span className="font-semibold text-smvitm-text flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} className="text-[#C59048]" /> {scholarship.academicYear}
            </span>
          </div>
          <div>
            <span className="text-smvitm-textSecondary block text-2xs uppercase tracking-wider font-medium">Sponsor</span>
            <span className="font-semibold text-smvitm-text flex items-center gap-1.5 mt-0.5">
              <Award size={13} className="text-[#7B1436]" /> {scholarship.sponsorName}
            </span>
          </div>
          <div>
            <span className="text-smvitm-textSecondary block text-2xs uppercase tracking-wider font-medium">Created On</span>
            <span className="font-semibold text-smvitm-text flex items-center gap-1.5 mt-0.5">
              <Clock size={13} className="text-slate-500" /> {formatDate(scholarship.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-smvitm-textSecondary block text-2xs uppercase tracking-wider font-medium">Conferral Event</span>
            <span className="font-semibold text-[#7B1436] flex items-center gap-1.5 mt-0.5">
              <Sparkles size={13} className="text-[#C59048]" /> Annual College Day
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Objective & Description */}
          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-smvitm-maroon flex items-center gap-2">
              <Sparkles size={16} className="text-[#C59048]" /> Objective &amp; Purpose
            </h3>
            <p className="text-sm text-smvitm-text leading-relaxed bg-[#FBF7F2] p-4 rounded-xl border border-[#E2D9CE]/70">
              {scholarship.purpose || scholarship.description}
            </p>
          </div>

          {/* Eligibility & Selection Criteria */}
          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-smvitm-maroon flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C59048]" /> Eligibility Criteria &amp; Rules
            </h3>
            <div className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-xs">
              <div className="text-xs text-smvitm-text whitespace-pre-line leading-relaxed font-sans space-y-2">
                {scholarship.eligibilityCriteria}
              </div>
            </div>
          </div>

          {/* Weightages & Selection System */}
          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-smvitm-maroon flex items-center gap-2">
              <Percent size={16} className="text-[#C59048]" /> Selection Criteria Weightages (Score out of 100)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF0F3] border border-[#7B1436]/20">
                <span className="text-2xs font-semibold text-[#7B1436] uppercase">Previous Sem B.E.</span>
                <div className="font-heading text-2xl font-bold text-[#7B1436] mt-1">60%</div>
                <p className="text-[11px] text-[#8A7E82] mt-0.5">Academic consistency</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-2xs font-semibold text-amber-800 uppercase">PUC / 12th Marks</span>
                <div className="font-heading text-2xl font-bold text-amber-900 mt-1">20%</div>
                <p className="text-[11px] text-amber-700 mt-0.5">Pre-university baseline</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xs font-semibold text-slate-700 uppercase">SSLC / 10th Marks</span>
                <div className="font-heading text-2xl font-bold text-slate-800 mt-1">10%</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Foundational record</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-2xs font-semibold text-emerald-800 uppercase">College Activities</span>
                <div className="font-heading text-2xl font-bold text-emerald-900 mt-1">10%</div>
                <p className="text-[11px] text-emerald-700 mt-0.5">Conduct &amp; participation</p>
              </div>
            </div>
          </div>

          {/* Screening Committee Composition */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users size={14} className="text-[#7B1436]" /> Screening &amp; Selection Committee
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Comprising: <strong>Principal, Dean(A), IQAC Coordinator, Heads of Departments (HODs), Student Welfare Officer (SWO)</strong>, and <strong>Management Representative</strong>. Decision of the committee is final.
            </p>
          </div>

          {/* Custom Fields & Additional Criteria (If configured) */}
          {scholarship.customFields && scholarship.customFields.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-[#C59048]" /> Additional Custom Criteria &amp; Fields
                </h4>
                <Link href={`/admin/scholarships/${id}/edit`}>
                  <span className="text-2xs text-[#7B1436] font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit size={12} /> Edit Fields
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scholarship.customFields.map((f) => (
                  <div key={f.id} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] space-y-1">
                    <span className="text-2xs font-bold text-[#7B1436] uppercase tracking-wider block">
                      {f.label}
                    </span>
                    <p className="text-xs text-slate-800 font-medium">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Committee Voting Participation Card & Reset Voting */}
          {(isPublished || isVotingOpen || isClosed) && (
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border-2 border-[#C59048]/40 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-base text-[#7B1436] flex items-center gap-2">
                    <VoteIcon size={18} className="text-[#C59048]" />
                    Committee Voting Progress &amp; Participation
                  </h4>
                  <p className="text-xs text-smvitm-textSecondary mt-0.5">
                    <strong>{votes.length} of {committeeMembers.length}</strong> committee members have cast ratings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowResetModal(true)}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1.5 shadow-xs"
                  >
                    <RotateCcw size={13} /> Reset All Votes
                  </Button>
                  <Link href={`/admin/scholarships/${id}/results`}>
                    <Button size="sm" className="bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-semibold gap-1.5 shadow-sm">
                      <Award size={14} /> View Roster &amp; Leaderboard →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-mono font-bold text-slate-600">
                  <span>FACULTY COMPLETION RATE</span>
                  <span>{Math.round((votes.length / (committeeMembers.length || 1)) * 100)}% ({votes.length}/{committeeMembers.length} Members)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C59048] to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((votes.length / (committeeMembers.length || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#FBF7F2] border-t border-[#E2D9CE] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/scholarships">
            <Button variant="ghost" size="sm" className="gap-1.5 text-smvitm-textSecondary hover:text-smvitm-text">
              <ArrowLeft size={15} /> All Scholarships List
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/admin/scholarships/${id}/edit`}>
              <Button variant="secondary" size="md" className="gap-1.5 border-[#C59048] text-[#7B1436] hover:bg-[#FAF0F3] font-semibold">
                <Edit size={15} /> Edit Scheme / Fields
              </Button>
            </Link>

            <Link href={`/admin/scholarships/${id}/nominees`}>
              <Button variant="secondary" size="md" className="gap-2 border-[#C59048] text-[#7B1436] hover:bg-[#FAF0F3] font-semibold">
                <Users size={16} /> Manage Nominees
              </Button>
            </Link>

            {(isPublished || isVotingOpen || isClosed) && (
              <Link href={`/admin/scholarships/${id}/results`}>
                <Button variant="secondary" size="md" className="gap-2 border-[#122147] text-[#122147] hover:bg-slate-100 font-semibold">
                  <Award size={16} /> View Ratings &amp; Leaderboard
                </Button>
              </Link>
            )}

            {isDraft && (
              <Button onClick={handlePublish} isLoading={actionLoading} size="md" className="bg-[#7B1436] hover:bg-[#5A0F28] text-white gap-2 font-semibold shadow-sm">
                Publish Scheme for Voting <ArrowRight size={16} />
              </Button>
            )}

            {isPublished && (
              <Button onClick={handleOpenVoting} isLoading={actionLoading} size="md" className="bg-[#C59048] hover:bg-[#A87430] text-white gap-2 font-semibold shadow-sm">
                <VoteIcon size={16} /> Open SWB Voting Now
              </Button>
            )}

            {isVotingOpen && (
              <Button onClick={handleCloseVoting} isLoading={actionLoading} size="md" variant="danger" className="gap-2 font-semibold">
                Close Voting &amp; Compute Results
              </Button>
            )}

            {isClosed && (
              <Link href={`/admin/scholarships/${id}/results`}>
                <Button size="md" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-semibold">
                  <Award size={16} /> View Final Results
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modal: Reset Voting Confirmation ─── */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Scholarship Voting & Ratings"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResetModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetAllVotes} isLoading={actionLoading}>
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

    </div>
  );
}
