'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { Header } from '@/components/layout/Header';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'student') {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/swb/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'student') {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Scholarship Portal" />
      <div className="flex flex-1">
        <StudentSidebar />
        <main className="flex-1 p-6 bg-smvitm-bg min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
