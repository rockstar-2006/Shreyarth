'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else router.replace('/student/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-smvitm-surface rounded-lg shadow-xl border border-smvitm-border overflow-hidden">
        {/* Header */}
        <div className="bg-smvitm-maroon px-8 py-6 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/smvitm-logo.svg"
              alt="SMVITM Logo"
              width={160}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-heading text-white text-xl font-bold">Scholarship Portal</h1>
          <p className="text-white/70 text-sm mt-1">Student Welfare Board — SMVITM</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <h2 className="font-heading text-smvitm-maroon text-lg font-semibold text-center mb-2">
            Sign in to your account
          </h2>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md"
            >
              {error}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="your.email@smvitm.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            aria-label="Email address"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-label="Password"
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            size="lg"
            aria-label="Sign in"
          >
            Sign in
          </Button>

          <p className="text-center text-xs text-smvitm-textSecondary mt-4">
            Contact your administrator if you don&apos;t have an account.
          </p>
        </form>
      </div>

      <p className="text-center text-white/60 text-xs mt-4">
        © {new Date().getFullYear()} SMVITM, Bantakal, Udupi. All rights reserved.
      </p>
    </div>
  );
}
