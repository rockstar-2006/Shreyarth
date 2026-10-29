import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, accent = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-smvitm-surface rounded-xl border border-smvitm-border shadow-card',
        accent && 'border-t-2 border-t-smvitm-maroon',
        onClick && 'cursor-pointer hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-smvitm-border/70', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-smvitm-border/70 bg-smvitm-bg/50 rounded-b-xl', className)}>
      {children}
    </div>
  );
}
