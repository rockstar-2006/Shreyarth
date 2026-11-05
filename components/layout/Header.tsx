'use client';

import { LogOut, ChevronDown } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatRole } from '@/lib/utils/formatters';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const roleColors: Record<string, string> = {
  admin:      'bg-smvitm-maroon/10 text-smvitm-maroon',
  swb_member: 'bg-smvitm-goldFaint text-smvitm-gold',
  student:    'bg-smvitm-infoBg text-smvitm-info',
};

export function Header({
  title = 'scholarship-smv — Scholarship Portal',
  onToggleSidebar,
  isSidebarOpen = false,
}: HeaderProps) {
  const { user, signOut } = useAuthContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-smvitm-surface/95 backdrop-blur-md border-b border-smvitm-border h-16 flex items-center px-4 md:px-6 gap-3 shadow-xs">
      {/* Sidebar toggle button (when enabled) */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C59048]/40 bg-[#FDF6E7] hover:bg-[#F9ECCF] text-[#7B1436] transition-all duration-150 active:scale-95 text-xs font-semibold shadow-xs group"
          title={isSidebarOpen ? "Close Menu" : "Open Menu"}
          aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded bg-[#7B1436] text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </span>
          <span className="font-heading tracking-wide">
            {isSidebarOpen ? 'Close Menu' : 'Menu'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59048] animate-pulse" />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-smvitm-text font-heading font-bold text-sm md:text-base truncate flex items-center gap-2">
          {title}
        </h1>
      </div>

      {/* Right — user menu */}
      {user && (
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-smvitm-bg transition-colors group"
            aria-label="User menu"
            aria-expanded={open}
          >
            {/* Avatar */}
            <span className="h-7 w-7 rounded-full bg-smvitm-maroon flex items-center justify-center text-white text-xs font-bold select-none">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
              <span className="text-smvitm-text text-sm font-medium">{user.name}</span>
              <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded-full ${roleColors[user.role] ?? 'bg-smvitm-bg text-smvitm-textSecondary'}`}>
                {formatRole(user.role)}
              </span>
            </div>
            <ChevronDown size={14} className={`text-smvitm-textMuted transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-smvitm-surface border border-smvitm-border rounded-xl shadow-float animate-fade-in overflow-hidden z-50">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-smvitm-border bg-smvitm-bg">
                <p className="text-xs font-semibold text-smvitm-text truncate">{user.name}</p>
                <p className="text-2xs text-smvitm-textMuted truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-smvitm-error hover:bg-smvitm-errorBg transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
