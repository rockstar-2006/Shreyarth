'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else if (user.role === 'student') router.replace('/student/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <FullPageSpinner />;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-smvitm-bg px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/smvitm-logo.svg"
            alt="SMVITM Logo"
            width={200}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl font-bold text-smvitm-maroon mb-3">
          Scholarship Portal
        </h1>
        <p className="text-smvitm-textSecondary text-lg mb-2">
          Shri Madhwa Vadiraja Institute of Technology &amp; Management
        </p>
        <p className="text-smvitm-textSecondary text-sm mb-8">
          Bantakal, Udupi — Karnataka
        </p>

        {/* Divider */}
        <div className="border-t border-smvitm-border mb-8" />

        <p className="text-smvitm-textSecondary mb-6">
          Streamlining scholarship awards through transparent, committee-based selection.
        </p>

        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto">
            Login to Portal
          </Button>
        </Link>
      </div>
    </main>
  );
}
