'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user && user.role !== 'admin') {
      if (user.role === 'swb_member') router.replace('/swb/dashboard');
      else router.replace('/student/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Admin Dashboard" />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-smvitm-bg min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
