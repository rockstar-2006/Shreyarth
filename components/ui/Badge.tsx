import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'gold' | 'success' | 'error' | 'outline';
  className?: string;
}

const variants = {
  default: 'bg-smvitm-maroon text-white',
  secondary: 'bg-smvitm-bg text-smvitm-text border border-smvitm-border',
  gold: 'bg-smvitm-gold text-white',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  outline: 'bg-transparent border border-smvitm-maroon text-smvitm-maroon',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
