'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  AlertCircle,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Sparkles,
} from 'lucide-react';

type RoleType = 'student' | 'swb' | 'admin';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuthContext();
  const router = useRouter();

  const [role, setRole] = useState<RoleType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const handleRoleChange = (selectedRole: RoleType) => {
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'student') {
      setEmail('student@smvitm.ac.in');
      setPassword('student123');
    } else if (selectedRole === 'swb') {
      setEmail('swb@smvitm.ac.in');
      setPassword('swb12345');
    } else {
      setEmail('admin@smvitm.edu.in');
      setPassword('Admin@1234');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else router.replace('/student/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else router.replace('/student/dashboard');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your email and password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] animate-slide-up">
      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-[#7B1436]/5 border border-[#E9DED8] p-7 sm:p-9 relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7B1436] via-[#C59048] to-[#122147]" />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B1436]/10 text-[#7B1436] text-[11px] font-bold tracking-wider uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Institutional Login
            </span>
            <span className="text-[11px] text-[#8A7E82] font-medium">
              Academic Year 2026–27
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#34252D] tracking-tight">
            Sign in to your portal
          </h2>
          <p className="text-[#8A7E82] text-xs sm:text-sm mt-1 leading-relaxed">
            {role === 'student' &&
              'Access your scholarship applications, scrutiny status, and disbursement details.'}
            {role === 'swb' &&
              'Access committee evaluation sheets, document scrutiny, and voting dashboards.'}
            {role === 'admin' &&
              'Manage institutional schemes, quotas, disbursements, and student welfare board.'}
          </p>
        </div>

        {/* Interactive Role Selector Pills */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#8A7E82] mb-2">
            Select Your Role
          </p>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F5EDE4]/80 border border-[#E9DED8]">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                role === 'student'
                  ? 'bg-white text-[#7B1436] shadow-sm'
                  : 'text-[#8A7E82] hover:text-[#34252D]'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('swb')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                role === 'swb'
                  ? 'bg-white text-[#7B1436] shadow-sm'
                  : 'text-[#8A7E82] hover:text-[#34252D]'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>SWB Member</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-[#7B1436] shadow-sm'
                  : 'text-[#8A7E82] hover:text-[#34252D]'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* ─── Google Sign-In for Faculty & Staff ─── */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#34252D] font-heading font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl border-2 border-[#E2D9CE] hover:border-[#C59048] shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-60 group"
          >
            {googleLoading ? (
              <span className="inline-block animate-spin h-4 w-4 border-2 border-[#7B1436] border-t-transparent rounded-full" />
            ) : (
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span className="text-[#34252D] group-hover:text-[#7B1436]">
              {googleLoading ? 'Signing in with Google...' : 'Sign in with Google (Faculty & Staff)'}
            </span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#E2D9CE] w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-[#8A7E82] uppercase tracking-wider">
              or sign in with password
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs px-4 py-3 rounded-xl animate-fade-in"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82] mb-1.5"
            >
              {role === 'student' ? 'Student College Email / USN' : 'Institutional Email'}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E82] pointer-events-none"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder={
                  role === 'student'
                    ? '4mw23cs001@smvitm.ac.in'
                    : role === 'swb'
                    ? 'swb.evaluator@smvitm.ac.in'
                    : 'admin@smvitm.ac.in'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-[#FDFBF7] border border-[#E9DED8] rounded-xl text-[#34252D] placeholder:text-[#8A7E82]/50 focus:outline-none focus:ring-2 focus:ring-[#7B1436]/20 focus:border-[#7B1436] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-[0.12em] text-[#8A7E82]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() =>
                  toast('Please contact the SWB Admin office at scholarships@sode-edu.in for password resets.', {
                    icon: 'ℹ️',
                  })
                }
                className="text-[11px] font-medium text-[#7B1436] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E82] pointer-events-none"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm bg-[#FDFBF7] border border-[#E9DED8] rounded-xl text-[#34252D] placeholder:text-[#8A7E82]/50 focus:outline-none focus:ring-2 focus:ring-[#7B1436]/20 focus:border-[#7B1436] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7E82] hover:text-[#34252D] p-1 cursor-pointer transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#7B1436] hover:bg-[#5a0f28] text-white font-semibold text-xs sm:text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Authenticating with SMVITM...</span>
              </>
            ) : (
              <>
                <span>Sign in as {role === 'student' ? 'Student' : role === 'swb' ? 'SWB Evaluator' : 'Administrator'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Drawer */}
        <div className="mt-5 pt-4 border-t border-[#E9DED8]/70">
          <button
            type="button"
            onClick={() => setShowDemoHelp(!showDemoHelp)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#7B1436] hover:text-[#5a0f28] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#C59048]" />
              Need quick test credentials? (Click to view)
            </span>
            <span className="text-xs">{showDemoHelp ? '▲' : '▼'}</span>
          </button>

          {showDemoHelp && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#F5EDE4]/60 border border-[#E9DED8] space-y-1.5 text-[11px] text-[#34252D] animate-fade-in">
              <div
                onClick={() => handleRoleChange('student')}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white cursor-pointer transition"
              >
                <span className="font-medium text-[#7B1436]">Student:</span>
                <span className="font-mono text-[10px] text-[#8A7E82]">student@smvitm.ac.in (Click to fill)</span>
              </div>
              <div
                onClick={() => handleRoleChange('swb')}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white cursor-pointer transition"
              >
                <span className="font-medium text-[#7B1436]">SWB Member:</span>
                <span className="font-mono text-[10px] text-[#8A7E82]">swb@smvitm.ac.in (Click to fill)</span>
              </div>
              <div
                onClick={() => handleRoleChange('admin')}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white cursor-pointer transition"
              >
                <span className="font-medium text-[#7B1436]">Admin:</span>
                <span className="font-mono text-[10px] text-[#8A7E82]">admin@smvitm.edu.in (Click to fill)</span>
              </div>
            </div>
          )}
        </div>

        {/* Support Help */}
        <p className="text-center text-[#8A7E82] text-[11px] mt-4 leading-relaxed">
          Need portal enrollment?{' '}
          <span className="text-[#7B1436] font-semibold">Contact your Department Scholarship Coordinator.</span>
        </p>
      </div>
    </div>
  );
}
