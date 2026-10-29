'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Star, Menu, X, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/swb/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
];

export function SWBSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/smvitm-logo.png" alt="SMVITM" className="h-9 w-9 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div>
          <p className="text-white font-heading font-bold text-sm leading-none">SMVITM</p>
          <p className="text-white/40 text-2xs mt-0.5">Scholarship Portal</p>
        </div>
      </div>
      <div className="px-5 pt-4 pb-2">
        <span className="text-2xs font-semibold tracking-[0.12em] uppercase text-white/30">SWB Panel</span>
      </div>
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href) && idx === 0;
          return (
            <Link key={`${item.href}-${idx}`} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white/90 hover:bg-white/08'
              )}>
              <span className={cn('flex items-center justify-center h-7 w-7 rounded-md transition-colors',
                isActive ? 'bg-smvitm-gold/90 text-white' : 'bg-white/10 text-white/50 group-hover:bg-white/15 group-hover:text-white/80')}>
                <Icon size={15} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/20 text-2xs">© {new Date().getFullYear()} SMVITM</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 bg-sidebar-gradient min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>
      <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu"
        className="md:hidden fixed bottom-5 left-5 z-50 bg-smvitm-maroon text-white p-3.5 rounded-full shadow-float">
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 bg-sidebar-gradient animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
