'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vote, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/swb/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/swb/dashboard', label: 'Vote on Scholarships', icon: Vote },
];

export function SWBSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href) && idx === 0;
        return (
          <Link
            key={`${item.href}-${idx}`}
            href={item.href}
            aria-label={item.label}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-smvitm-gold text-white shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 bg-smvitm-maroonDark min-h-screen">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">SWB Panel</p>
        </div>
        <NavLinks />
      </aside>

      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="bg-smvitm-maroon text-white p-3 rounded-full shadow-lg"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 bg-smvitm-maroonDark">
            <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">SWB Panel</p>
              <button onClick={() => setMobileOpen(false)} aria-label="Close sidebar" className="text-white/60">
                <X size={18} />
              </button>
            </div>
            <NavLinks />
          </div>
        </div>
      )}
    </>
  );
}
