'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Award, 
  Users, 
  PlusCircle, 
  X, 
  ExternalLink, 
  ChevronRight,
  FileSpreadsheet,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  kannadaLabel: string;
  categoryTag: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  isExternal?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    kannadaLabel: 'ಮುಖಪುಟ & ಅಂಕಿ-ಅಂಶ',
    categoryTag: 'HOME',
    description: 'Overview, key numbers & quick metrics',
    icon: LayoutDashboard,
    badge: 'Overview',
  },
  {
    href: '/admin/scholarships',
    label: 'Scholarships',
    kannadaLabel: 'ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆಗಳು',
    categoryTag: 'SCHEMES',
    description: 'Browse, edit and manage all schemes',
    icon: Award,
    badge: 'All Schemes',
  },
  {
    href: '/admin/scholarships/new',
    label: 'Create Scholarship',
    kannadaLabel: 'ಹೊಸ ಯೋಜನೆ ಸೇರಿಸಿ',
    categoryTag: 'NEW',
    description: 'Set up a new scholarship and eligibility',
    icon: PlusCircle,
    badge: '+ Add',
  },
  {
    href: '/admin/students',
    label: 'Student Database',
    kannadaLabel: 'ವಿದ್ಯಾರ್ಥಿ ದಾಖಲಾತಿ',
    categoryTag: 'EXCEL DATA',
    description: 'Excel sheet upload & student records',
    icon: FileSpreadsheet,
    badge: 'Excel Registry',
  },
  {
    href: '/admin/applications',
    label: 'Student Applications',
    kannadaLabel: 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಗಳು',
    categoryTag: 'FORM',
    description: 'Review public Google-form registrations',
    icon: ClipboardList,
    badge: 'Self-Registered',
  },
  {
    href: '/admin/users',
    label: 'User Management',
    kannadaLabel: 'ಬಳಕೆದಾರರು & ಸಮಿತಿ',
    categoryTag: 'USERS',
    description: 'Staff, admin and SWB committee logins',
    icon: Users,
    badge: 'Staff & SWB',
  },
  {
    href: '/',
    label: 'Student Portal',
    kannadaLabel: 'ವಿದ್ಯಾರ್ಥಿ ಪೋರ್ಟಲ್',
    categoryTag: 'PREVIEW',
    description: 'View the live portal seen by students',
    icon: ExternalLink,
    badge: 'Public Site',
    isExternal: true,
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Smooth open & reverse close animation coordination
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setMounted(true);
      timer = setTimeout(() => setIsAnimating(true), 20);
    } else {
      setIsAnimating(false);
      // Wait for all cards to complete the exit animation (max delay 275ms + 320ms transition = ~600ms)
      timer = setTimeout(() => setMounted(false), 620);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto">
      {/* Soft blurred glass backdrop — no solid maroon wall */}
      <div 
        className={cn(
          'fixed inset-0 bg-[#122147]/45 backdrop-blur-md transition-opacity duration-300 ease-in-out',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Card Deck Container (No background maroon solid container) */}
      <aside 
        className="relative z-10 w-full max-w-sm sm:w-[410px] h-full flex flex-col bg-transparent overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin"
        role="dialog"
        aria-label="Admin Navigation Menu"
      >
        {/* ─── Top Centered Close Button & Clean College Header ─── */}
        <div className="flex flex-col items-center justify-center mb-5 flex-shrink-0 animate-fade-in">
          
          {/* Centered Top Close Button */}
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#7B1436] hover:bg-[#7B1436] hover:text-white border-2 border-[#C59048] shadow-float hover:shadow-2xl transition-all duration-200 active:scale-95 text-xs font-bold font-heading group"
            aria-label="Close Navigation"
            title="Close Navigation (Esc)"
          >
            <X size={16} className="text-[#C59048] group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
            <span className="tracking-wide">Close Navigation ✕</span>
          </button>

          {/* Clean College Identity Pill */}
          <div className="mt-3 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#C59048]/40 shadow-sm flex items-center gap-2 text-2xs text-[#7B1436] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59048] animate-pulse" />
            <span className="font-heading">SHREYARTH · SMVITM Portal</span>
          </div>

          <p className="text-[11px] text-white/90 font-medium drop-shadow-sm mt-1">
            Scholarship Administration Menu
          </p>
        </div>

        {/* ─── Animated Floating Cards (GSAP-smooth cascade from left, reverse out to left) ─── */}
        <nav className="space-y-3 flex-1 pb-6">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = !item.isExternal && (
              pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
            );

            // GSAP-smooth stagger timings
            const delayMs = isAnimating
              ? idx * 50
              : (navItems.length - 1 - idx) * 35;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!item.isExternal) onClose();
                }}
                style={{
                  animationDelay: `${delayMs}ms`,
                }}
                className={cn(
                  'group relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-200 shadow-card hover:shadow-cardHover',
                  isAnimating
                    ? 'animate-card-fly-in'
                    : 'animate-card-fly-out pointer-events-none',
                  isActive
                    ? 'bg-white border-[#C59048] ring-2 ring-[#C59048]/50 shadow-lg'
                    : 'bg-white/95 hover:bg-white border-[#C59048]/40 hover:border-[#7B1436]'
                )}
              >
                {/* Top Label & Badge */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#EADFCF]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-[#7B1436] bg-[#FAF0F3] px-2 py-0.5 rounded border border-[#7B1436]/20">
                      {item.categoryTag}
                    </span>
                    <span className="text-[11px] text-[#8A7E82] font-serif">
                      {item.kannadaLabel}
                    </span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold',
                      isActive 
                        ? 'bg-[#C59048] text-[#122147]'
                        : 'bg-slate-100 text-slate-700'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Main Card Content with Live Animated Icon */}
                <div className="flex items-center gap-3.5">
                  
                  {/* Live Icon Box */}
                  <div className={cn(
                    'relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-xs',
                    isActive
                      ? 'bg-[#7B1436] text-[#F3DE98] animate-icon-pulse'
                      : 'bg-[#FAF0F3] text-[#7B1436] group-hover:bg-[#7B1436] group-hover:text-white'
                  )}>
                    <Icon size={20} />
                    
                    {/* Live Pulse Indicator for active or interactive card */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C59048] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C59048]"></span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-heading font-bold truncate flex items-center gap-1.5',
                      isActive ? 'text-[#7B1436]' : 'text-[#18181B] group-hover:text-[#7B1436]'
                    )}>
                      {item.label}
                    </p>
                    <p className="text-2xs text-[#8A7E82] truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight 
                    size={16} 
                    className={cn(
                      'text-slate-400 group-hover:text-[#7B1436] group-hover:translate-x-1.5 transition-all flex-shrink-0',
                      isActive && 'text-[#7B1436] translate-x-1'
                    )} 
                  />
                </div>

                {/* Left Active Color Indicator Strip */}
                {isActive && (
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-1.5 bg-[#C59048] rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ─── Bottom Info Badge ─── */}
        <div className="text-center pt-2 pb-4 text-[11px] text-white/90 drop-shadow flex-shrink-0">
          <p className="font-semibold">Shri Madhwa Vadiraja Institute of Technology & Management</p>
          <p className="text-2xs opacity-80">Bantakal, Udupi · Sode Vadiraja Mutt Education Trust</p>
        </div>

      </aside>
    </div>
  );
}
