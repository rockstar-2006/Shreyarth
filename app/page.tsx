'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { type LucideIcon } from 'lucide-react';
import {
  Sparkles,
  ArrowRight,
  Lock,
  HeartHandshake,
  CalendarClock,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  Search,
  HelpCircle,
  ChevronDown,
  Star,
  Heart,
  Landmark,
  Building2,
  Award,
  Users,
  X,
  FileCheck2,
  Menu,
} from 'lucide-react';

/* ── Scholarships Data ── */
interface Scholarship {
  id: number;
  title: string;
  description: string;
  amount: string;
  deadline: string;
  category: string;
  eligibility: string;
  seats: string;
  icon: LucideIcon;
}

const scholarships: Scholarship[] = [
  {
    id: 1,
    title: 'Merit Scholarship for Top Rankers',
    description:
      'Awarded to students with outstanding academic records (CET rank < 5,000 or CGPA ≥ 8.50). Covers up to 100% of college tuition fee for the current academic year.',
    amount: '₹1,00,000 / yr',
    deadline: '31 Dec 2026',
    category: 'Merit-Based',
    eligibility: 'CGPA ≥ 8.50 / CET < 5,000',
    seats: '50 Scholars',
    icon: Star,
  },
  {
    id: 2,
    title: 'SSVMET Need-Based Financial Aid',
    description:
      'Direct grant from Shri Sode Vadiraja Mutt Education Trust for deserving students from economically weaker sections with annual family income below ₹8 Lakhs.',
    amount: '₹75,000 / yr',
    deadline: '15 Jan 2027',
    category: 'Need-Based (EWS)',
    eligibility: 'Family Income < ₹8 Lakhs',
    seats: '100 Scholars',
    icon: Heart,
  },
  {
    id: 3,
    title: 'AICTE Pragati & Saksham Scheme',
    description:
      'Central government scholarships for girl students (Pragati) and specially-abled students (Saksham) admitted to AICTE approved technical degree programs.',
    amount: '₹50,000 / yr',
    deadline: '28 Feb 2027',
    category: 'Government (AICTE)',
    eligibility: 'Girls / PwD Students',
    seats: 'All Eligible',
    icon: Landmark,
  },
  {
    id: 4,
    title: 'Management Endowment Scholarship',
    description:
      'Instituted by alumni and philanthropic patrons of SMVITM for students excelling across engineering branches who maintain minimum 7.00 CGPA with no backlogs.',
    amount: '₹60,000 / yr',
    deadline: '31 Jan 2027',
    category: 'Trust & Institutional',
    eligibility: 'CGPA ≥ 7.00 (No backlogs)',
    seats: '120 Scholars',
    icon: Building2,
  },
  {
    id: 5,
    title: 'IEEE WIE Women in Tech Fellowship',
    description:
      'Sponsored by Quest Global & IEEE Bangalore Section for women students in CSE, AI-DS, and ECE displaying leadership and technical research potential.',
    amount: '₹40,000 / yr',
    deadline: '15 Mar 2027',
    category: 'Corporate & Alumni',
    eligibility: 'Women in Tech · IEEE Member',
    seats: '25 Scholars',
    icon: Users,
  },
  {
    id: 6,
    title: 'Sports & Cultural Excellence Award',
    description:
      'Special fee concessions and cash grants for students who have represented Visvesvaraya Technological University (VTU) or the State in recognized tournaments.',
    amount: '₹35,000 / yr',
    deadline: '30 Apr 2027',
    category: 'Sports & Cultural',
    eligibility: 'University / State level medalist',
    seats: '30 Scholars',
    icon: Award,
  },
];

const categories = [
  'All',
  'Merit-Based',
  'Need-Based (EWS)',
  'Trust & Institutional',
  'Corporate & Alumni',
  'Government (AICTE)',
];

const steps = [
  {
    step: 1,
    title: 'Browse & verify',
    description:
      'Explore available scholarships filtered by your stream, marks, and family income to choose the schemes that match your profile.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Check eligibility',
    description:
      'Review threshold marks, required certificates (income certificate, caste/category certificate, marks cards) before filling the form.',
    icon: FileText,
  },
  {
    step: 3,
    title: 'Submit online',
    description:
      'Complete the digital application with your USN, upload PDF documents, and receive your unique Application Tracking ID.',
    icon: Upload,
  },
  {
    step: 4,
    title: 'DBT disbursement',
    description:
      'Upon committee verification and approval, scholarship amounts are credited directly into your Aadhaar-linked student bank account.',
    icon: CheckCircle2,
  },
];

const faqs = [
  {
    q: 'Who is eligible to apply for scholarships at SMVITM?',
    a: 'Any bonafide student enrolled in undergraduate engineering programs at Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM) is eligible. Specific schemes require maintaining a CGPA (e.g., 7.00 or 8.50) or having an annual family income below specified limits.',
  },
  {
    q: 'Can I apply for more than one scholarship?',
    a: 'Yes, students are welcome to apply for all scholarships for which they meet the eligibility criteria. However, as per institutional and VTU regulations, dual fee waivers cannot be combined. If selected for multiple, the higher beneficial scheme will be awarded.',
  },
  {
    q: 'What documents are required for application?',
    a: 'Required documents typically include: Latest semester grade card, valid Income Certificate issued by Tahsildar (within 6 months for EWS), Aadhaar Card (student & parent), Bonafide Certificate, and Student Bank Passbook copy.',
  },
  {
    q: 'How and when will the scholarship amount be disbursed?',
    a: 'Sanctioned funds are disbursed via Direct Benefit Transfer (DBT) directly into the student bank account or adjusted towards the college tuition fee ledger for the subsequent semester, depending on the scheme guidelines.',
  },
  {
    q: 'How can I check the status of my submitted application?',
    a: 'You can check your status at any time by signing in to the portal using your College USN (e.g., 4MW23CS045) or contacting the Student Welfare Board (SWB).',
  },
];

export default function HomePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<Scholarship | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Preserve user dashboard redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else if (user.role === 'student') router.replace('/student/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <FullPageSpinner />;

  const filteredScholarships = scholarships.filter((s) => {
    const matchesCat =
      selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FBF7F2] text-[#34252D] selection:bg-[#F1DCE8] selection:text-[#7B1436]">
      {/* ─── STICKY HEADER (Matches AASARE) ─── */}
      <header className="sticky top-0 z-40 border-b border-[#E9DED8]/60 bg-[#FBF7F2]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#7B1436] to-[#5a0f28] border-2 border-[#C59048]/40 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg
                className="h-6 w-6 text-[#C59048]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M12 14l2 2 4-4" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-baseline">
                <span className="font-display text-xl font-bold tracking-tight text-[#7B1436]">
                  SHREY
                </span>
                <span className="font-display text-xl font-bold italic text-[#C59048] ml-0.5">
                  ARTH
                </span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8A7E82]">
                ಶ್ರೇಯಾರ್ಥ · SMVITM Scholarship Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#home"
              className="relative rounded-full px-4 py-2 text-sm font-medium text-[#7B1436]"
            >
              Home
              <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-[#C59048]" />
            </a>
            <a
              href="#scholarships"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D] transition-colors"
            >
              Scholarships
            </a>
            <a
              href="#eligibility"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D] transition-colors"
            >
              Eligibility
            </a>
            <a
              href="#how-it-works"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D] transition-colors"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D] transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/login"
              className="ml-3 inline-flex items-center rounded-full bg-[#7B1436] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 hover:shadow-md cursor-pointer"
            >
              Sign in
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 md:hidden text-[#34252D] cursor-pointer"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E9DED8]/60 bg-[#FBF7F2] px-5 py-4 space-y-1">
            <a
              href="#home"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-[#7B1436]"
            >
              Home
            </a>
            <a
              href="#scholarships"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D]"
            >
              Scholarships
            </a>
            <a
              href="#eligibility"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D]"
            >
              Eligibility
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-[#8A7E82] hover:text-[#34252D]"
            >
              How it works
            </a>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center rounded-full bg-[#7B1436] px-5 py-2.5 text-sm font-medium text-white mt-3"
            >
              Sign in
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO SECTION (Matches AASARE radial glow & layout) ─── */}
        <section id="home" className="relative overflow-hidden bg-radial-warm">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:grid-cols-[1.15fr_1fr] md:px-8 md:py-28">
            {/* Left Content */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C59048]/40 bg-[#C59048]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#7B1436]">
                <Sparkles className="h-3.5 w-3.5 text-[#7B1436]" aria-hidden="true" />
                ॥ ಶ್ರೇಯಾರ್ಥ • SHREYARTH PORTAL ॥
              </span>

              <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] text-[#7B1436] md:text-6xl lg:text-7xl">
                A brighter future,{' '}
                <em className="font-normal italic text-[#C59048]">whenever</em>{' '}
                you strive for one.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8A7E82]">
                <strong className="text-[#7B1436] font-semibold">SHREYARTH (ಶ್ರೇಯಾರ್ಥ)</strong> is the official Institutional Scholarship &amp; Financial Aid Portal of SMVITM. Empowering student merit (<em className="text-[#7B1436]">Shrey</em>) with dedicated institutional grant (<em className="text-[#C59048]">Arth</em>). Browse endowment funds, check eligibility, and submit your scholarship application seamlessly.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#scholarships"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#7B1436] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#7B1436]/20 transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
                >
                  Find a scholarship
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E9DED8] bg-white px-6 py-3 text-sm font-medium text-[#34252D] transition hover:border-[#7B1436]/40 cursor-pointer"
                >
                  How it works
                </a>
              </div>

              {/* Trust Badges matching AASARE */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-[#8A7E82]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C59048]" aria-hidden="true" />
                  <span>Strictly confidential</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-[#C59048]" aria-hidden="true" />
                  <span>Trust &amp; faculty-led</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-[#C59048]" aria-hidden="true" />
                  <span>Direct Benefit Transfer (DBT)</span>
                </div>
              </div>
            </div>

            {/* Right Card (AASARE "Today's Availability" Style) */}
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-[#C59048]/25 via-transparent to-[#7B1436]/15 blur-2xl" />
              <div className="relative rounded-3xl border border-[#E9DED8] bg-white p-6 shadow-2xl shadow-[#7B1436]/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A7E82]">
                    SCHOLARSHIP PORTAL STATUS
                  </p>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)] animate-pulse" />
                </div>

                <div className="mt-5 space-y-3">
                  {scholarships.slice(0, 3).map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-[#E9DED8]/80 bg-[#FDFBF7] px-4 py-3 hover:border-[#C59048]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#7B1436]/10 flex items-center justify-center text-[#7B1436]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#34252D]">
                              {s.title}
                            </p>
                            <p className="text-xs text-[#8A7E82]">
                              {s.amount} · {s.seats}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-semibold text-[#047857]">
                          Open
                        </span>
                      </div>
                    );
                  })}
                </div>

                <a
                  href="#scholarships"
                  className="mt-5 flex items-center justify-between rounded-xl bg-[#7B1436]/5 px-4 py-3 text-sm font-medium text-[#7B1436] transition hover:bg-[#7B1436]/10"
                >
                  <span>See all open scholarships</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3 HIGHLIGHTS (Matches AASARE's 3 Feature Cards) ─── */}
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-[#E9DED8] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7B1436]/5">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C59048]/10 blur-2xl transition group-hover:bg-[#C59048]/20" />
              <Lock className="h-6 w-6 text-[#7B1436]" aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl text-[#34252D]">
                Strictly transparent
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#8A7E82]">
                Every application is evaluated by the institutional scholarship committee under strict VTU and Trust norms — merit-first, fair, and unbiased.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-[#E9DED8] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7B1436]/5">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C59048]/10 blur-2xl transition group-hover:bg-[#C59048]/20" />
              <HeartHandshake className="h-6 w-6 text-[#7B1436]" aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl text-[#34252D]">
                Trust &amp; faculty guided
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#8A7E82]">
                Sponsored by Shri Sode Vadiraja Mutt Education Trust, disbursing over ₹3.2+ Crores annually to support more than 500+ engineers every year.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-[#E9DED8] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7B1436]/5">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C59048]/10 blur-2xl transition group-hover:bg-[#C59048]/20" />
              <CalendarClock className="h-6 w-6 text-[#7B1436]" aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl text-[#34252D]">
                Apply in minutes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#8A7E82]">
                Paperless digital process. Upload marks cards, income proofs, and track real-time progress right to sanction and bank transfer.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SCHOLARSHIP DIRECTORY (Grid & Filters) ─── */}
        <section id="scholarships" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C59048]/40 bg-[#C59048]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#7B1436]">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Scholarship Directory
              </span>
              <h2 className="mt-4 font-display text-4xl text-[#7B1436] md:text-5xl">
                Find the right <em className="font-normal italic text-[#C59048]">support</em> for you.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#8A7E82]">
                Select from our endowment, government, and corporate scholarship offerings. Filter by category or search by keywords.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 text-[#8A7E82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholarship..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E9DED8] bg-white text-xs text-[#34252D] outline-none focus:border-[#7B1436] transition shadow-xs placeholder:text-[#8A7E82]/60"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#7B1436] text-white shadow-xs'
                    : 'bg-white text-[#8A7E82] border border-[#E9DED8] hover:border-[#7B1436]/40 hover:text-[#34252D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScholarships.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9DED8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7B1436]/5 flex flex-col justify-between"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C59048]/10 blur-2xl transition group-hover:bg-[#C59048]/20" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-[#7B1436]/10 flex items-center justify-center text-[#7B1436]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7E82] bg-[#F5EDE4] px-2.5 py-1 rounded-full">
                        {s.category}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-xl text-[#34252D]">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#8A7E82]">
                      {s.description}
                    </p>

                    <div className="mt-4 space-y-1.5 text-xs text-[#8A7E82] border-t border-[#E9DED8]/60 pt-3">
                      <div className="flex items-center justify-between">
                        <span>Grant Amount:</span>
                        <span className="font-semibold text-[#7B1436]">{s.amount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Eligibility:</span>
                        <span className="font-medium text-[#34252D]">{s.eligibility}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Deadline:</span>
                        <span className="font-medium text-[#C59048]">{s.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E9DED8] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A7E82]">{s.seats}</span>
                    <button
                      onClick={() => {
                        setActiveModal(s);
                        setApplySuccess(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#7B1436] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5a0f28] shadow-xs cursor-pointer"
                    >
                      Apply Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── STATS SECTION ─── */}
        <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
          <div className="rounded-3xl border border-[#E9DED8] bg-white p-8 md:p-12 shadow-sm">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-[#7B1436]">
                  ₹3.2+ Cr
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8A7E82] mt-1">
                  Disbursed Annually
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-[#C59048]">
                  500+
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8A7E82] mt-1">
                  Student Scholars
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-[#122147]">
                  15+
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8A7E82] mt-1">
                  Active Schemes
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-[#047857]">
                  94%
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8A7E82] mt-1">
                  Sanction Rate
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS (4 simple steps) ─── */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E9DED8] bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#7B1436]">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Application Process
          </span>
          <h2 className="mt-6 font-display text-4xl text-[#7B1436] md:text-5xl">
            Four simple <em className="font-normal italic text-[#C59048]">steps</em>.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#8A7E82]">
            From discovering the right scheme to receiving financial sanction — a completely transparent and student-friendly journey.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9DED8] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7B1436]/5"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C59048]/10 blur-2xl transition group-hover:bg-[#C59048]/20" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-[#7B1436]" aria-hidden="true" />
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7B1436]/10 text-xs font-bold text-[#7B1436]">
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-xl text-[#34252D]">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#8A7E82]">
                      {s.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── ELIGIBILITY SECTION ─── */}
        <section id="eligibility" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="rounded-3xl border border-[#E9DED8] bg-[#FDFBF7] p-8 md:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C59048]/40 bg-[#C59048]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#7B1436]">
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              General Guidelines
            </span>
            <h2 className="mt-4 font-display text-3xl text-[#7B1436] md:text-4xl">
              Who is <em className="font-normal italic text-[#C59048]">eligible</em> to apply?
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="bg-white rounded-2xl p-6 border border-[#E9DED8]">
                <p className="font-semibold text-sm text-[#7B1436] mb-3 uppercase tracking-wider text-[11px]">
                  Academic Criteria
                </p>
                <ul className="space-y-2 text-xs text-[#8A7E82]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Regular student enrolled in BE courses at SMVITM.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Minimum 7.00 CGPA (8.50 for pure merit grants).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>No active backlogs at the time of scrutiny.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E9DED8]">
                <p className="font-semibold text-sm text-[#7B1436] mb-3 uppercase tracking-wider text-[11px]">
                  Financial Guidelines
                </p>
                <ul className="space-y-2 text-xs text-[#8A7E82]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Annual family income &lt; ₹8,00,000 for EWS aid.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Valid revenue department certificate required.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Student must possess active Aadhaar-linked bank A/C.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E9DED8]">
                <p className="font-semibold text-sm text-[#7B1436] mb-3 uppercase tracking-wider text-[11px]">
                  Mandatory Documents
                </p>
                <ul className="space-y-2 text-xs text-[#8A7E82]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Marks cards of previous semesters / 10+2.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>Income &amp; Caste certificate (if applicable).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C59048] font-bold">✓</span>
                    <span>College ID Card and Bonafide verification.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="mx-auto max-w-3xl px-5 py-20 md:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C59048]/40 bg-[#C59048]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#7B1436]">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Frequently Asked
            </span>
            <h2 className="mt-6 font-display text-4xl text-[#7B1436] md:text-5xl">
              Answers to your <em className="font-normal italic text-[#C59048]">queries</em>.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-[#E9DED8] bg-white transition-shadow open:shadow-lg open:shadow-[#7B1436]/5"
                {...(i === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-semibold text-[#34252D] [&::-webkit-details-marker]:hidden list-none">
                  {f.q}
                  <ChevronDown
                    className="h-4 w-4 text-[#7B1436] transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-xs sm:text-sm leading-relaxed text-[#8A7E82]">
                    {f.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ─── BOTTOM CTA BANNER ─── */}
        <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-[#7B1436] px-6 py-10 text-white shadow-2xl shadow-[#7B1436]/20 md:px-16 md:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#C59048]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#C59048]/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C59048]">
                Applications open for 2026–27
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-white md:text-5xl">
                Reaching out for aid shouldn&apos;t feel difficult. We&apos;ll walk with you.
              </h2>
              <a
                href="#scholarships"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#F5EDE4] px-6 py-3 text-sm font-semibold text-[#7B1436] transition hover:bg-white hover:shadow-md cursor-pointer"
              >
                Browse scholarships
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── INTERACTIVE APPLICATION MODAL ─── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#E9DED8] bg-white p-6 md:p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-[#8A7E82] hover:text-[#34252D] hover:bg-[#F5EDE4] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {!applySuccess ? (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7E82]">
                  {activeModal.category}
                </span>
                <h3 className="font-display text-2xl text-[#7B1436] mt-1">
                  Apply for {activeModal.title}
                </h3>
                <p className="text-xs text-[#8A7E82] mt-1">
                  Grant: <strong className="text-[#C59048]">{activeModal.amount}</strong> · Deadline: {activeModal.deadline}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setApplySuccess(true);
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E9DED8] text-xs outline-none focus:border-[#7B1436] bg-white text-[#34252D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                        College USN
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="4MW23CS001"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E9DED8] text-xs outline-none focus:border-[#7B1436] bg-white text-[#34252D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                        Current CGPA
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 8.75"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E9DED8] text-xs outline-none focus:border-[#7B1436] bg-white text-[#34252D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                        Department
                      </label>
                      <select className="w-full px-4 py-2.5 rounded-xl border border-[#E9DED8] text-xs outline-none focus:border-[#7B1436] bg-white text-[#34252D]">
                        <option>Computer Science (CSE)</option>
                        <option>AI &amp; Data Science</option>
                        <option>Electronics (ECE)</option>
                        <option>Civil Engineering</option>
                        <option>Mechanical Engg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                        Family Income (Annual)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="₹ in Lakhs"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E9DED8] text-xs outline-none focus:border-[#7B1436] bg-white text-[#34252D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1">
                      Upload Supporting PDF (Marks card / Income cert)
                    </label>
                    <div className="border-2 border-dashed border-[#E9DED8] rounded-xl p-4 text-center hover:border-[#7B1436]/40 cursor-pointer transition bg-white">
                      <Upload className="h-5 w-5 text-[#8A7E82] mx-auto mb-1" />
                      <p className="text-[11px] text-[#8A7E82]">
                        Click to select PDF or drag and drop (Max 5MB)
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#7B1436] text-white font-semibold text-xs tracking-wider uppercase transition hover:bg-[#5a0f28] shadow-md cursor-pointer mt-2"
                  >
                    Submit Scholarship Application
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="h-14 w-14 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl text-[#7B1436]">
                  Application Received!
                </h3>
                <p className="text-xs text-[#8A7E82] mt-2 max-w-sm mx-auto leading-relaxed">
                  Your application for <strong>{activeModal.title}</strong> has been registered.
                </p>
                <div className="my-4 inline-block bg-[#F5EDE4] px-4 py-2 rounded-xl text-sm font-bold text-[#7B1436] tracking-wider font-mono">
                  SMVITM-2026-84920
                </div>
                <p className="text-[11px] text-[#8A7E82]">
                  Sign in to track your status anytime with your Student credentials.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-[#7B1436] px-5 py-2 text-xs font-medium text-white hover:bg-[#5a0f28]"
                  >
                    Go to Sign in
                  </Link>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-full border border-[#E9DED8] px-5 py-2 text-xs font-medium text-[#34252D] hover:bg-[#F5EDE4]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FOOTER (Matches AASARE) ─── */}
      <footer className="mt-24 border-t border-[#E9DED8]/60 bg-[#F5EDE4]/60 print:hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7B1436] to-[#5a0f28] border-2 border-[#C59048]/40 flex items-center justify-center flex-shrink-0">
                <svg
                  className="h-6 w-6 text-[#C59048]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                  <path d="M12 14l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-[#7B1436]">
                  VIDYANIDHI
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8A7E82]">
                  Institutional Scholarship Cell · SMVITM
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#8A7E82]">
              Shri Madhwa Vadiraja Institute of Technology &amp; Management. Affiliated to VTU Belagavi, Approved by AICTE, Accredited by NAAC. Managed by Shri Sode Vadiraja Mutt Education Trust (SSVMET), Udupi.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#34252D]">Navigate</p>
            <ul className="mt-4 space-y-2 text-sm text-[#8A7E82]">
              <li>
                <a className="hover:text-[#7B1436] transition-colors" href="#scholarships">
                  Scholarship Directory
                </a>
              </li>
              <li>
                <Link className="hover:text-[#7B1436] transition-colors" href="/login">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <a className="hover:text-[#7B1436] transition-colors" href="#eligibility">
                  Eligibility Guidelines
                </a>
              </li>
              <li>
                <a className="hover:text-[#7B1436] transition-colors" href="#how-it-works">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#34252D]">Reach us</p>
            <ul className="mt-4 space-y-2 text-sm text-[#8A7E82]">
              <li>Vishwothama Nagar, Bantakal – 574115</li>
              <li>Udupi District, Karnataka, India</li>
              <li>scholarships@sode-edu.in</li>
              <li>+91 820 258 9182 / 9183</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E9DED8]/60">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-[#8A7E82] md:flex-row md:items-center md:px-8">
            <p>© 2026 SMVITM · VIDYANIDHI Scholarship Cell. All rights reserved.</p>
            <p className="italic text-[#7B1436] font-medium">
              विद्या ददाति विनयं विनयाद्याति पात्रताम् — Knowledge bestows humility &amp; worthiness.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
