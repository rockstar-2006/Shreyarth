'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SWBSidebar } from '@/components/layout/SWBSidebar';
import { Header } from '@/components/layout/Header';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function SWBLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'swb_member') {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/student/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'swb_member') {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="SWB Voting Panel" />
      <div className="flex flex-1">
        <SWBSidebar />
        <main className="flex-1 p-6 bg-smvitm-bg min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
