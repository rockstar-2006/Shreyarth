'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScholarship } from '@/lib/firebase/firestore/scholarships';
import { listNominees } from '@/lib/firebase/firestore/nominees';
import { getVote, submitVote } from '@/lib/firebase/firestore/votes';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Scholarship, Nominee } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Award, 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  FileText, 
  Star, 
  AlertCircle,
  ThumbsUp,
  Save,
  GraduationCap,
  BookOpen,
  Tag,
  Phone
} from 'lucide-react';

function getResolvedBranch(department?: string, usn?: string): string {
  if (department && !department.startsWith('Cat:') && !department.startsWith('Category:') && department.trim() !== 'B.E' && department.trim() !== '') {
    return department;
  }
  if (!usn) return 'Regular B.E';
  const upper = usn.toUpperCase().trim();
  if (upper.includes('AD') || upper.includes('AI')) return 'AI & Data Science (B.E)';
  if (upper.includes('CS')) return 'Computer Science (B.E)';
  if (upper.includes('CD')) return 'Computer Science & Design (B.E)';
  if (upper.includes('EC')) return 'Electronics & Comm. (B.E)';
  if (upper.includes('IS')) return 'Information Science (B.E)';
  if (upper.includes('CV')) return 'Civil Engineering (B.E)';
  if (upper.includes('ME')) return 'Mechanical Engineering (B.E)';
  if (upper.includes('MB') || upper.includes('BA')) return 'MBA';
  if (upper.includes('MC')) return 'MCA';
  return 'Regular B.E';
}

function getPriorScholarshipInfo(nominee: Nominee): { isFirstTime: boolean; label: string } {
  const prev = nominee.prevScholarship;
  if (!prev || prev.toLowerCase() === 'none' || prev.toLowerCase() === 'nil' || prev.toLowerCase() === 'no' || prev.toLowerCase() === 'na' || prev === '—' || prev === '-') {
    return { isFirstTime: true, label: 'First-Time Applicant (No Prior Scholarship)' };
  }
  return { isFirstTime: false, label: prev };
}

function getCleanRemarks(description?: string): string {
  if (!description) return '';
  if (description.includes('|')) {
    const parts = description.split('|').map((p) => p.trim());
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== '-' && lastPart !== '—' && !lastPart.startsWith('Income:') && !lastPart.startsWith('Prev:')) {
      return lastPart;
    }
    return '';
  }
  return description;
}

export default function FacultyRatingPage() {
  const params = useParams<{ id?: string; scholarshipId?: string }>();
  const id = params?.id || params?.scholarshipId;
  const router = useRouter();
  const { user } = useAuthContext();

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    Promise.all([
      getScholarship(id),
      listNominees(id),
      getVote(id, user.uid),
    ]).then(([s, nList, v]) => {
      setScholarship(s);
      setNominees(nList);
      if (v && v.ratings) {
        setRatings(v.ratings);
        setHasPreviousSubmission(true);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      toast.error('Failed to load rating sheet');
      setLoading(false);
    });
  }, [id, user]);

  const handleRate = (nomineeId: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [nomineeId]: score,
    }));
  };

  const ratedCount = Object.keys(ratings).filter((k) => ratings[k] > 0).length;
  const isComplete = nominees.length > 0 && ratedCount === nominees.length;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit evaluations.');
      return;
    }

    if (ratedCount === 0) {
      toast.error('Please rate at least one student before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await submitVote(
        id,
        user.uid,
        user.name || 'Faculty Committee Member',
        ratings
      );
      toast.success('Your ratings have been successfully submitted!');
      setHasPreviousSubmission(true);
      router.push('/swb/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit ratings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl border border-[#E2D9CE] p-8 shadow-card">
        <AlertCircle size={44} className="text-[#C59048] mx-auto mb-3" />
        <h2 className="font-heading text-xl font-bold text-smvitm-maroon mb-2">Scholarship Not Found</h2>
        <p className="text-smvitm-textSecondary text-sm mb-6">The requested scholarship evaluation sheet does not exist.</p>
        <Link href="/swb/dashboard">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft size={16} /> Back to Faculty Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const getScoreLabel = (score: number) => {
    if (score === 10) return { label: 'Exceptional (Top Priority)', color: 'text-emerald-700 font-bold' };
    if (score >= 8) return { label: 'Outstanding / Highly Deserving', color: 'text-emerald-600 font-semibold' };
    if (score >= 6) return { label: 'Good / Recommended', color: 'text-amber-700 font-semibold' };
    if (score >= 4) return { label: 'Average', color: 'text-slate-600' };
    return { label: 'Below Average', color: 'text-rose-600' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-fade-in">
      
      {/* ─── Top Header Navigation ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2D9CE]">
        <Link href="/swb/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-[#7B1436] hover:bg-[#FAF0F3]">
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <Sparkles size={12} className="text-emerald-600" />
            Faculty Evaluation Sheet
          </span>
          {hasPreviousSubmission && (
            <span className="text-2xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
              Previously Submitted
            </span>
          )}
        </div>
      </div>

      {/* ─── Scholarship Overview Banner ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white p-6 shadow-xl border border-[#C59048]/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-2xs text-[#F3DE98] font-mono tracking-wider uppercase">
            <span>SMVITM SCHOLARSHIP COMMITTEE EVALUATION</span>
            <span>•</span>
            <span>A.Y. {scholarship.academicYear}</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {scholarship.title}
          </h1>

          <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {scholarship.purpose || scholarship.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs border-t border-white/15">
            <div className="flex items-center gap-1.5">
              <Award size={15} className="text-[#F3DE98]" />
              <span className="font-semibold text-white">Award: {formatCurrency(scholarship.amount)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <User size={15} className="text-[#F3DE98]" />
              <span>Evaluator: <strong>{user?.name}</strong> ({user?.department || 'Faculty Member'})</span>
            </div>
          </div>

          {/* Additional Custom Criteria (If configured by admin) */}
          {scholarship.customFields && scholarship.customFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-white/15 text-xs">
              {scholarship.customFields.map((f) => (
                <div key={f.id} className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                  <span className="text-[10px] text-[#F3DE98] font-mono font-bold uppercase tracking-wider block">
                    {f.label}:
                  </span>
                  <span className="text-white/90 text-xs mt-0.5 block font-medium">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Rating Instructions & Live Progress ─── */}
      <div className="bg-[#FAF7F2] rounded-2xl border-2 border-[#C59048]/30 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-[#7B1436] flex items-center gap-2">
              <Star size={16} className="text-[#C59048] fill-[#C59048]" />
              Student Rating Instructions (Score 1 to 10)
            </h3>
            <p className="text-xs text-smvitm-textSecondary mt-0.5 leading-relaxed">
              Rate each candidate out of <strong>10</strong> based on academic consistency, financial need, and conduct.
              The top 6 students will be compiled by the committee based on total scores.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 bg-white px-4 py-2 rounded-xl border border-[#E2D9CE] shadow-xs">
            <span className="text-xs text-smvitm-textSecondary">Evaluated:</span>
            <span className="font-heading font-bold text-sm text-[#7B1436]">
              {ratedCount} / {nominees.length}
            </span>
            {isComplete ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Progress meter */}
        <div className="w-full bg-[#E2D9CE]/60 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#C59048] to-[#1A7A4A] transition-all duration-300"
            style={{ width: `${nominees.length > 0 ? (ratedCount / nominees.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ─── Nominees Candidate Rating Cards ─── */}
      {nominees.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-smvitm-textSecondary">
            <p className="text-base font-semibold mb-1">No Nominated Candidates Found</p>
            <p className="text-xs">The administrator has not yet assigned candidate students to this scholarship.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {nominees.map((nominee, idx) => {
            const currentRating = ratings[nominee.studentId] || 0;
            const scoreInfo = currentRating > 0 ? getScoreLabel(currentRating) : null;
            const branchName = getResolvedBranch(nominee.department, nominee.rollNumber);
            const { isFirstTime, label: priorScholarshipLabel } = getPriorScholarshipInfo(nominee);
            const cleanRemarks = getCleanRemarks(nominee.description);
            const cgpaValue = typeof nominee.cgpa === 'number' && nominee.cgpa > 0 ? nominee.cgpa : 8.5;

            return (
              <div 
                key={nominee.id || nominee.studentId}
                className={`bg-white rounded-2xl border-2 transition-all duration-200 p-5 shadow-card hover:shadow-cardHover ${
                  currentRating > 0 ? 'border-[#C59048] ring-1 ring-[#C59048]/40' : 'border-[#E2D9CE]'
                }`}
              >
                {/* Student Top Header: Sl No, Name, USN, and Rating status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E2D9CE]/60">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FAF0F3] to-[#F3DE98]/30 text-[#7B1436] font-heading font-bold text-sm flex items-center justify-center border border-[#7B1436]/20 flex-shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-heading text-lg font-bold text-[#18181B] leading-snug">
                          {nominee.studentName}
                        </h4>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          USN: {nominee.rollNumber}
                        </span>
                      </div>

                      {/* Quick Academic & Identity Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Prominent CGPA Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 font-mono font-bold text-xs shadow-xs">
                          <GraduationCap size={15} className="text-[#C59048]" />
                          <span>CGPA: {cgpaValue.toFixed(2)}</span>
                        </div>

                        {/* Branch / Department */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold">
                          <BookOpen size={13} className="text-[#7B1436]" />
                          <span>{branchName}</span>
                        </span>

                        {/* Caste / Category */}
                        {nominee.caste && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF0F3] border border-[#7B1436]/20 text-[#7B1436] text-xs font-bold">
                            <Tag size={13} className="text-[#7B1436]" />
                            <span>Category: {nominee.caste}</span>
                          </span>
                        )}

                        {/* Annual Income */}
                        {nominee.income !== undefined && nominee.income !== null && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                            <span>Income: {formatCurrency(nominee.income)}/yr</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Rating Pill */}
                  <div className="flex-shrink-0 text-right">
                    {currentRating > 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-heading font-bold text-xs shadow-xs">
                        <Star size={14} className="fill-emerald-600 text-emerald-600" />
                        <span>Rating: {currentRating} / 10</span>
                      </div>
                    ) : (
                      <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Not Rated Yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Full Detailed Student Profile Grid */}
                <div className="mt-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE]/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold text-2xs uppercase tracking-wider">Degree / Sem:</span>
                    <span className="font-semibold text-slate-800">{nominee.semester || 'Regular B.E'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold text-2xs uppercase tracking-wider">Prior Award:</span>
                    {isFirstTime ? (
                      <span className="text-emerald-700 font-semibold text-2xs bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Sparkles size={11} /> First-Time Applicant
                      </span>
                    ) : (
                      <span className="text-amber-900 font-semibold text-2xs bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                        {priorScholarshipLabel}
                      </span>
                    )}
                  </div>

                  {nominee.mobileNo && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold text-2xs uppercase tracking-wider">Contact:</span>
                      <span className="font-mono text-slate-800 text-xs flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" /> {nominee.mobileNo}
                      </span>
                    </div>
                  )}
                </div>

                {/* ─── Extra Details / Candidate Profile Description ─── */}
                {nominee.description && nominee.description.trim() ? (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF8F5] to-[#FDF6E7]/40 border border-[#C59048]/50 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1.5 text-[#7B1436] font-heading font-bold text-xs uppercase tracking-wider">
                      <FileText size={15} className="text-[#C59048]" />
                      <span>Candidate Profile &amp; Extra Details (For Screening Committee)</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium bg-white/80 p-3 rounded-lg border border-[#E2D9CE]/60">
                      {nominee.description}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-2xs text-slate-500 italic flex items-center gap-1.5">
                    <FileText size={13} className="text-slate-400" />
                    <span>No extra candidate description provided. Evaluated on academic merit, category, and income.</span>
                  </div>
                )}

                {/* ─── 1 to 10 Rating Buttons ─── */}
                <div className="pt-4 mt-1 border-t border-[#E2D9CE]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Rate this student (Score 1 to 10):
                    </span>
                    {scoreInfo && (
                      <span className={`text-xs ${scoreInfo.color}`}>
                        {scoreInfo.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected = currentRating === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleRate(nominee.studentId, score)}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-heading font-bold text-sm transition-all duration-150 active:scale-95 border ${
                            isSelected
                              ? score >= 8
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-105 ring-2 ring-emerald-400'
                                : score >= 6
                                ? 'bg-[#C59048] text-white border-[#B58038] shadow-md scale-105 ring-2 ring-amber-300'
                                : 'bg-[#7B1436] text-white border-[#5A0F28] shadow-md scale-105'
                              : 'bg-[#FAF8F5] hover:bg-white text-slate-700 border-[#E2D9CE] hover:border-[#C59048]'
                          }`}
                        >
                          <span>{score}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Floating / Sticky Bottom Submission Bar ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-[#C59048]/40 py-4 px-6 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0F3] border border-[#7B1436]/20 flex items-center justify-center text-[#7B1436] font-bold">
              {ratedCount}/{nominees.length}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isComplete ? 'All candidates rated!' : `${nominees.length - ratedCount} candidate(s) pending rating`}
              </p>
              <p className="text-2xs text-slate-500">
                Ratings are compiled by the Student Welfare Board for final scholarship selection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/swb/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={ratedCount === 0}
              className="w-full sm:w-auto bg-[#7B1436] hover:bg-[#5A0F28] text-white font-heading font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Save size={16} className="mr-2" />
              {hasPreviousSubmission ? 'Update Ratings' : 'Submit Ratings'}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
