import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  IndianRupee,
  Lock,
  ArrowLeft,
  PhoneCall,
} from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FBF7F2]">
      {/* ─── LEFT: Rich Brand & Impact Panel ─── */}
      <div className="lg:w-[50%] xl:w-[48%] bg-gradient-to-br from-[#7B1436] via-[#5A0F28] to-[#3D0A1C] text-white p-8 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Animated ambient glowing circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#C59048]/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#122147]/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[#C59048]/10 blur-2xl" />

        {/* Top: Logo & Accreditation */}
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/smvitm-logo.svg"
                  alt="SMVITM Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div>
                <div className="flex items-baseline leading-tight">
                  <span className="font-display text-xl font-bold tracking-tight text-white">
                    SHREY
                  </span>
                  <span className="font-display text-xl font-bold italic text-[#C59048] ml-0.5">
                    ARTH
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C59048] block">
                  ಶ್ರೇಯಾರ್ಥ · SMVITM Portal
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1 rounded-full text-[11px] text-white/90">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>NAAC A Grade · VTU Belagavi</span>
            </div>
          </div>
        </div>

        {/* Centre: Regal Copy & Dynamic Stats */}
        <div className="relative z-10 py-10 lg:py-12 space-y-8">
          {/* Live notification pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#C59048]/50 bg-[#C59048]/15 px-3.5 py-1.5 text-xs font-medium text-[#E8B84B] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#E8B84B]" />
            <span className="tracking-wide">Academic Year 2026–27 Applications Live</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Empowering talent.{' '}
              <span className="italic font-normal text-[#E8B84B] block">
                Rewarding excellence.
              </span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-lg">
              Welcome to the official scholarship portal of Shri Madhwa Vadiraja Institute of Technology &amp; Management. Transparent, paperless, and merit-first.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3.5 pt-2">
            <div className="rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-4 hover:bg-white/[0.12] transition-colors">
              <div className="flex items-center gap-1.5 text-[#E8B84B] mb-1">
                <IndianRupee className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Disbursed</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-white">₹3.2+ Cr</p>
              <p className="text-[10px] text-white/60 mt-0.5">Annually</p>
            </div>

            <div className="rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-4 hover:bg-white/[0.12] transition-colors">
              <div className="flex items-center gap-1.5 text-[#E8B84B] mb-1">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Scholars</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-white">1,250+</p>
              <p className="text-[10px] text-white/60 mt-0.5">Supported</p>
            </div>

            <div className="rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-4 hover:bg-white/[0.12] transition-colors">
              <div className="flex items-center gap-1.5 text-[#E8B84B] mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Sanction</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-white">94.8%</p>
              <p className="text-[10px] text-white/60 mt-0.5">On-time DBT</p>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-3 pt-2">
            {[
              'Committee-based impartial merit evaluation with isolated scoring',
              'Direct Benefit Transfer (DBT) straight into student bank accounts',
              '100% confidential family income certificates and academic marks records',
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-white/80">
                <CheckCircle2 className="h-4 w-4 text-[#E8B84B] shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Institutional Footer */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
          <p>© {new Date().getFullYear()} SMVITM Bantakal · SSVMET Trust</p>
          <p className="italic text-[#E8B84B] font-medium hidden sm:block">
            विद्या ददाति विनयं — Knowledge bestows humility
          </p>
        </div>
      </div>

      {/* ─── RIGHT: Clean, Balanced Authentication Suite ─── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Top helper header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8A7E82] hover:text-[#7B1436] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Scholarship Directory</span>
          </Link>

          <a
            href="tel:+918202589182"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-[#7B1436] bg-[#7B1436]/5 hover:bg-[#7B1436]/10 px-3.5 py-1.5 rounded-full transition-colors border border-[#7B1436]/15"
          >
            <PhoneCall className="h-3.5 w-3.5 text-[#C59048]" />
            <span>Helpdesk: +91 820 258 9182</span>
          </a>
        </div>

        {/* The Login Form Component */}
        <div className="flex-1 flex items-center justify-center py-4">
          {children}
        </div>

        {/* Security badge footer */}
        <div className="text-center pt-6 text-[11px] text-[#8A7E82] border-t border-[#E9DED8]/60 flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[#047857]" />
          <span>256-bit SSL encrypted institutional access · Powered by SMVITM IT Cell</span>
        </div>
      </div>
    </div>
  );
}
