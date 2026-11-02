'use client';

import { useState, useMemo } from 'react';
import { useScholarships } from '@/lib/hooks/useScholarships';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  Folder, 
  FolderOpen, 
  Search, 
  Sparkles, 
  Vote, 
  Users, 
  FileText, 
  Calendar, 
  GraduationCap,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';

type FolderFilter = 'all' | 'published' | 'voting_open' | 'draft' | 'closed';

export default function AdminDashboardPage() {
  const { scholarships, loading } = useScholarships();
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Compute key college metrics
  const stats = useMemo(() => {
    const total = scholarships.length;
    const drafts = scholarships.filter((s) => s.status === 'draft').length;
    const active = scholarships.filter((s) => s.status === 'published' || s.status === 'voting_open').length;
    const voting = scholarships.filter((s) => s.status === 'voting_open').length;
    const closed = scholarships.filter((s) => s.status === 'closed').length;
    
    // Total financial corpus allocated across all scholarships
    const totalCorpus = scholarships.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    return { total, drafts, active, voting, closed, totalCorpus };
  }, [scholarships]);

  // Unique academic years for filter
  const academicYears = useMemo(() => {
    const years = new Set(scholarships.map((s) => s.academicYear).filter(Boolean));
    return Array.from(years);
  }, [scholarships]);

  // Filter scholarships by folder tab, search query, and academic year
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      // Tab filter
      if (activeFolder === 'draft' && s.status !== 'draft') return false;
      if (activeFolder === 'voting_open' && s.status !== 'voting_open') return false;
      if (activeFolder === 'published' && s.status !== 'published') return false;
      if (activeFolder === 'closed' && s.status !== 'closed') return false;

      // Year filter
      if (selectedYear !== 'all' && s.academicYear !== selectedYear) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesSponsor = s.sponsorName?.toLowerCase().includes(q);
        const matchesPurpose = s.purpose?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSponsor && !matchesPurpose) return false;
      }

      return true;
    });
  }, [scholarships, activeFolder, selectedYear, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* ─── College Institutional Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white p-6 md:p-8 border border-[#C59048]/40 shadow-xl">
        {/* Subtle warm glow overlay */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-[#C59048]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-[#7B1436]/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Sacred invocation */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C59048]/40 text-[#F3DE98] text-xs font-serif tracking-wider">
              <Sparkles size={13} className="text-[#C59048]" />
              <span>॥ ಶ್ರೀ ವಾದಿರಾಜ ಪ್ರಸನ್ನ ॥ ಶ್ರೇಯಾರ್ಥ • श्रेयार्थ ॥</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Shreyarth Scholarship Portal — Admin Dashboard
            </h1>
            <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
              Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM) • Sode Vadiraja Mutt Education Trust.
              Empowering student merit (<strong className="text-[#F3DE98]">Shrey</strong>) with institutional financial grant (<strong className="text-[#C59048]">Arth</strong>).
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-2xs text-[#F3DE98]">
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <Calendar size={13} className="text-[#C59048]" />
                Academic Session: <strong className="text-white">2025–2026</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <GraduationCap size={13} className="text-[#C59048]" />
                Campus: <strong className="text-white">SMVITM, Bantakal</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <Award size={13} className="text-[#C59048]" />
                Total Scholarship Budget: <strong className="text-white">{formatCurrency(stats.totalCorpus)}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/admin/scholarships/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C59048] to-[#E5B568] hover:from-[#B58038] hover:to-[#D5A558] text-[#122147] font-heading font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>+ Add New Scholarship</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-fade-in">
          {/* Skeleton metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2D9CE] p-5 space-y-3 shadow-card">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Skeleton table */}
          <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
            <TableSkeleton rows={5} cols={5} />
          </div>
        </div>
      ) : (
        <>
          {/* ─── College Folder Cards for Metrics ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            
            {/* Folder 1: Total Scholarships */}
            <div className="relative pt-3 group">
              {/* Folder Top Tab Notch */}
              <div className="absolute top-0 left-4 px-3 py-0.5 rounded-t-lg bg-[#7B1436] text-[#F3DE98] text-[10px] font-mono tracking-wider font-semibold border-t border-x border-[#C59048]/40 shadow-xs z-10">
                FOLDER • ALL SCHEMES
              </div>
              <div className="bg-white rounded-xl rounded-tl-none border border-[#E2D9CE] p-5 shadow-card hover:shadow-cardHover hover:border-[#7B1436]/40 transition-all duration-200 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                      Total Scholarships
                    </p>
                    <p className="font-heading text-3xl font-bold text-[#7B1436]">
                      {stats.total}
                    </p>
                    <p className="text-2xs text-smvitm-textMuted">
                      Total Budget: <strong className="text-smvitm-text">{formatCurrency(stats.totalCorpus)}</strong>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#FAF0F3] border border-[#7B1436]/20 flex items-center justify-center text-[#7B1436]">
                    <BookOpen size={22} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs">
                  <span className="text-smvitm-textSecondary">All Created Schemes</span>
                  <Link href="/admin/scholarships" className="text-[#7B1436] font-semibold flex items-center gap-1 hover:underline">
                    View All <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Folder 2: Active & Voting */}
            <div className="relative pt-3 group">
              <div className="absolute top-0 left-4 px-3 py-0.5 rounded-t-lg bg-[#C59048] text-[#122147] text-[10px] font-mono tracking-wider font-bold border-t border-x border-[#C59048] shadow-xs z-10">
                FOLDER • ACTIVE & VOTING
              </div>
              <div className="bg-white rounded-xl rounded-tl-none border border-[#E2D9CE] p-5 shadow-card hover:shadow-cardHover hover:border-[#C59048]/60 transition-all duration-200 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                      Active Scholarships
                    </p>
                    <p className="font-heading text-3xl font-bold text-[#C59048]">
                      {stats.active}
                    </p>
                    <p className="text-2xs text-smvitm-textMuted">
                      <strong className="text-[#C59048]">{stats.voting}</strong> currently open for voting
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#FDF6E7] border border-[#C59048]/30 flex items-center justify-center text-[#C59048]">
                    <Vote size={22} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs">
                  <span className="text-smvitm-textSecondary">Committee Voting</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Progress
                  </span>
                </div>
              </div>
            </div>

            {/* Folder 3: Draft Scholarships */}
            <div className="relative pt-3 group">
              <div className="absolute top-0 left-4 px-3 py-0.5 rounded-t-lg bg-[#122147] text-[#F3DE98] text-[10px] font-mono tracking-wider font-semibold border-t border-x border-white/20 shadow-xs z-10">
                FOLDER • DRAFTS
              </div>
              <div className="bg-white rounded-xl rounded-tl-none border border-[#E2D9CE] p-5 shadow-card hover:shadow-cardHover hover:border-[#122147]/40 transition-all duration-200 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                      Draft Proposals
                    </p>
                    <p className="font-heading text-3xl font-bold text-[#122147]">
                      {stats.drafts}
                    </p>
                    <p className="text-2xs text-smvitm-textMuted">
                      Awaiting nominee list & publishing
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#122147]">
                    <Clock size={22} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs">
                  <span className="text-smvitm-textSecondary">Action Needed</span>
                  <span className="text-[#122147] font-semibold">
                    Review Nominees
                  </span>
                </div>
              </div>
            </div>

            {/* Folder 4: Completed & Awarded */}
            <div className="relative pt-3 group">
              <div className="absolute top-0 left-4 px-3 py-0.5 rounded-t-lg bg-emerald-800 text-emerald-100 text-[10px] font-mono tracking-wider font-semibold border-t border-x border-emerald-600 shadow-xs z-10">
                FOLDER • COMPLETED
              </div>
              <div className="bg-white rounded-xl rounded-tl-none border border-[#E2D9CE] p-5 shadow-card hover:shadow-cardHover hover:border-emerald-600/40 transition-all duration-200 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                      Completed & Awarded
                    </p>
                    <p className="font-heading text-3xl font-bold text-emerald-700">
                      {stats.closed}
                    </p>
                    <p className="text-2xs text-smvitm-textMuted">
                      Final recipients declared
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <CheckCircle size={22} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs">
                  <span className="text-smvitm-textSecondary">Award Status</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    Completed <CheckCircle size={11} />
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ─── Category Folder Tabs ─── */}
          <div className="space-y-4 pt-4">
            
            {/* Category Folder Tabs Bar */}
            <div className="flex flex-wrap items-end gap-1 sm:gap-2 border-b-2 border-[#7B1436] px-2">
              
              {/* Tab: All Scholarships */}
              <button
                type="button"
                onClick={() => setActiveFolder('all')}
                className={`relative px-4 sm:px-6 py-3 rounded-t-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 flex items-center gap-2 border-t-2 border-x-2 ${
                  activeFolder === 'all'
                    ? 'bg-[#7B1436] text-white border-[#7B1436] shadow-sm -mb-[2px] pb-[14px]'
                    : 'bg-[#EDE8E0] hover:bg-[#E2D9CE] text-smvitm-textSecondary border-[#D5CBBE]'
                }`}
              >
                <Folder size={15} className={activeFolder === 'all' ? 'text-[#F3DE98]' : 'text-smvitm-textMuted'} />
                <span>All Scholarships</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                  activeFolder === 'all' ? 'bg-[#F3DE98] text-[#7B1436]' : 'bg-black/10 text-smvitm-textSecondary'
                }`}>
                  {stats.total}
                </span>
              </button>

              {/* Tab: Published */}
              <button
                type="button"
                onClick={() => setActiveFolder('published')}
                className={`relative px-4 sm:px-6 py-3 rounded-t-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 flex items-center gap-2 border-t-2 border-x-2 ${
                  activeFolder === 'published'
                    ? 'bg-[#7B1436] text-white border-[#7B1436] shadow-sm -mb-[2px] pb-[14px]'
                    : 'bg-[#EDE8E0] hover:bg-[#E2D9CE] text-smvitm-textSecondary border-[#D5CBBE]'
                }`}
              >
                <TrendingUp size={15} className={activeFolder === 'published' ? 'text-[#F3DE98]' : 'text-smvitm-textMuted'} />
                <span>Published</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                  activeFolder === 'published' ? 'bg-[#F3DE98] text-[#7B1436]' : 'bg-black/10 text-smvitm-textSecondary'
                }`}>
                  {scholarships.filter(s => s.status === 'published').length}
                </span>
              </button>

              {/* Tab: Voting Open */}
              <button
                type="button"
                onClick={() => setActiveFolder('voting_open')}
                className={`relative px-4 sm:px-6 py-3 rounded-t-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 flex items-center gap-2 border-t-2 border-x-2 ${
                  activeFolder === 'voting_open'
                    ? 'bg-[#7B1436] text-white border-[#7B1436] shadow-sm -mb-[2px] pb-[14px]'
                    : 'bg-[#EDE8E0] hover:bg-[#E2D9CE] text-smvitm-textSecondary border-[#D5CBBE]'
                }`}
              >
                <Vote size={15} className={activeFolder === 'voting_open' ? 'text-[#F3DE98]' : 'text-smvitm-textMuted'} />
                <span>Voting Open</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                  activeFolder === 'voting_open' ? 'bg-[#F3DE98] text-[#7B1436]' : 'bg-black/10 text-smvitm-textSecondary'
                }`}>
                  {stats.voting}
                </span>
              </button>

              {/* Tab: Drafts */}
              <button
                type="button"
                onClick={() => setActiveFolder('draft')}
                className={`relative px-4 sm:px-6 py-3 rounded-t-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 flex items-center gap-2 border-t-2 border-x-2 ${
                  activeFolder === 'draft'
                    ? 'bg-[#7B1436] text-white border-[#7B1436] shadow-sm -mb-[2px] pb-[14px]'
                    : 'bg-[#EDE8E0] hover:bg-[#E2D9CE] text-smvitm-textSecondary border-[#D5CBBE]'
                }`}
              >
                <Clock size={15} className={activeFolder === 'draft' ? 'text-[#F3DE98]' : 'text-smvitm-textMuted'} />
                <span>Drafts</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                  activeFolder === 'draft' ? 'bg-[#F3DE98] text-[#7B1436]' : 'bg-black/10 text-smvitm-textSecondary'
                }`}>
                  {stats.drafts}
                </span>
              </button>

              {/* Tab: Completed / Closed */}
              <button
                type="button"
                onClick={() => setActiveFolder('closed')}
                className={`relative px-4 sm:px-6 py-3 rounded-t-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 flex items-center gap-2 border-t-2 border-x-2 ${
                  activeFolder === 'closed'
                    ? 'bg-[#7B1436] text-white border-[#7B1436] shadow-sm -mb-[2px] pb-[14px]'
                    : 'bg-[#EDE8E0] hover:bg-[#E2D9CE] text-smvitm-textSecondary border-[#D5CBBE]'
                }`}
              >
                <CheckCircle size={15} className={activeFolder === 'closed' ? 'text-[#F3DE98]' : 'text-smvitm-textMuted'} />
                <span>Completed</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                  activeFolder === 'closed' ? 'bg-[#F3DE98] text-[#7B1436]' : 'bg-black/10 text-smvitm-textSecondary'
                }`}>
                  {stats.closed}
                </span>
              </button>

            </div>

            {/* Search & Academic Year Toolbar */}
            <div className="bg-white rounded-xl border border-[#E2D9CE] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smvitm-textMuted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scholarship title, sponsor, or department..."
                  className="w-full pl-10 pr-4 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-sm text-smvitm-text placeholder:text-smvitm-textMuted focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-smvitm-textMuted hover:text-smvitm-text"
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              {/* Academic Year Filter */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter size={15} className="text-smvitm-textMuted" />
                <span className="text-xs font-semibold text-smvitm-textSecondary">Academic Session:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-medium text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                >
                  <option value="all">All Academic Sessions</option>
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      A.Y. {yr}
                    </option>
                  ))}
                </select>
              </div>

            </div>

          </div>

          {/* ─── Scholarship Cards in Folder Style ─── */}
          <div>
            {filteredScholarships.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#D5CBBE] rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF0F3] border border-[#7B1436]/20 flex items-center justify-center text-[#7B1436] mx-auto">
                  <FolderOpen size={32} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-smvitm-text">
                    No Scholarships Found
                  </h3>
                  <p className="text-smvitm-textSecondary text-sm max-w-md mx-auto mt-1">
                    {searchQuery || selectedYear !== 'all' || activeFolder !== 'all'
                      ? 'No scholarships match your selected search or filter criteria. Try clearing the search.'
                      : 'No scholarships have been created yet. Click "+ Add New Scholarship" to create one.'}
                  </p>
                </div>
                <Link
                  href="/admin/scholarships/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  <Plus size={16} /> Add First Scholarship
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredScholarships.map((s) => {
                  const isVotingOpen = s.status === 'voting_open';
                  const isDraft = s.status === 'draft';
                  const isClosed = s.status === 'closed';
                  const schemeTag = `SCHOLARSHIP #${s.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <div
                      key={s.id}
                      className="group relative bg-[#FFFDF9] rounded-xl border border-[#D5CBBE] hover:border-[#C59048] shadow-card hover:shadow-cardHover transition-all duration-200 flex flex-col overflow-hidden"
                    >
                      {/* Top Folder Tab Stripe */}
                      <div className="bg-gradient-to-r from-[#EDE8E0] to-[#F5F3EF] px-4 py-2 border-b border-[#D5CBBE] flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-[#7B1436] flex items-center gap-1.5">
                          <Folder size={12} className="text-[#C59048]" />
                          {schemeTag}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          isVotingOpen
                            ? 'bg-[#FDF6E7] text-[#C59048] border-[#C59048]/50 animate-pulse'
                            : isDraft
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : isClosed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        
                        <div className="space-y-2">
                          <h3 className="font-heading text-lg font-bold text-smvitm-text group-hover:text-[#7B1436] transition-colors line-clamp-2 leading-snug">
                            {s.title}
                          </h3>

                          {/* Sponsor acknowledgment */}
                          <div className="flex items-center gap-2 text-xs text-smvitm-textSecondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C59048]" />
                            <span className="font-medium text-smvitm-text truncate">
                              Sponsor: {s.sponsorName || 'SMVITM College Endowment'}
                            </span>
                          </div>

                          <p className="text-xs text-smvitm-textSecondary line-clamp-2 leading-relaxed">
                            {s.description || s.purpose || 'No description provided.'}
                          </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
                          <div>
                            <span className="text-[10px] text-smvitm-textMuted uppercase tracking-wider block">Award Amount</span>
                            <span className="font-bold text-[#7B1436] text-sm font-mono">
                              {formatCurrency(s.amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-smvitm-textMuted uppercase tracking-wider block">Academic Session</span>
                            <span className="font-medium text-smvitm-text">
                              A.Y. {s.academicYear || '2025-26'}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-[#E8E2D9] flex items-center justify-between text-[11px] text-smvitm-textSecondary">
                            <span>Student Welfare Board:</span>
                            <span className="font-medium text-[#122147]">
                              {s.swbMemberIds?.length || 0} Committee Members
                            </span>
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <Link
                            href={`/admin/scholarships/${s.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <FileText size={13} />
                            <span>Manage Scheme</span>
                          </Link>

                          {isDraft && (
                            <Link
                              href={`/admin/scholarships/${s.id}/nominees`}
                              className="inline-flex items-center gap-1 py-2 px-3 rounded-lg bg-[#FDF6E7] hover:bg-[#F8EDD3] text-[#7B1436] border border-[#C59048]/40 text-xs font-semibold transition-colors"
                              title="Review Student Nominees"
                            >
                              <Users size={13} className="text-[#C59048]" />
                              <span>Nominees</span>
                            </Link>
                          )}

                          {isVotingOpen && (
                            <Link
                              href={`/admin/scholarships/${s.id}`}
                              className="inline-flex items-center gap-1 py-2 px-3 rounded-lg bg-[#FDF6E7] hover:bg-[#F8EDD3] text-[#C59048] border border-[#C59048]/40 text-xs font-semibold transition-colors"
                              title="View Committee Votes"
                            >
                              <Vote size={13} />
                              <span>Votes</span>
                            </Link>
                          )}

                          {isClosed && (
                            <Link
                              href={`/admin/scholarships/${s.id}/results`}
                              className="inline-flex items-center gap-1 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-colors"
                              title="View Selected Awardee"
                            >
                              <Award size={13} />
                              <span>Awardee</span>
                            </Link>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── College Institutional Trust Footer Note ─── */}
          <div className="rounded-xl border border-[#D5CBBE] bg-[#F9F7F4] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-smvitm-textSecondary">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7B1436] text-[#F3DE98] flex items-center justify-center flex-shrink-0 font-serif font-bold text-sm">
                ಶ್ರೀ
              </div>
              <div>
                <p className="font-semibold text-smvitm-text">
                  Shri Sode Vadiraja Mutt Education Trust (SSVMET)
                </p>
                <p className="text-2xs text-smvitm-textMuted">
                  Shri Madhwa Vadiraja Institute of Technology & Management, Bantakal, Udupi. Scholarships awarded on merit-cum-means basis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 text-2xs">
              <span className="font-mono text-[#7B1436] font-semibold">
                SMVITM SCHOLARSHIP CELL
              </span>
              <span className="text-[#C59048]">●</span>
              <span>BANTAKAL, UDUPI</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
