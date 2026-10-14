'use client';

import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatRole } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Scholarship Portal' }: HeaderProps) {
  const { user, signOut } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-smvitm-maroon shadow-header">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-24 flex-shrink-0">
            <Image
              src="/smvitm-logo.svg"
              alt="SMVITM Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block border-l border-white/30 pl-3">
            <h1 className="font-heading text-white text-lg font-bold leading-tight">
              {title}
            </h1>
            <p className="text-white/70 text-xs">SMVITM, Bantakal, Udupi</p>
          </div>
        </div>

        {/* User info + Sign out */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-white text-sm font-semibold leading-none">{user.name}</span>
                <Badge variant="gold" className="mt-1 text-xs">{formatRole(user.role)}</Badge>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white" aria-hidden="true">
                <User size={16} />
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-md hover:bg-white/10"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
