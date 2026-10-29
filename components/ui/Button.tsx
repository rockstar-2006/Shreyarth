import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-smvitm-maroon hover:bg-smvitm-maroonDark text-white border-transparent',
  secondary: 'bg-transparent border border-smvitm-maroon text-smvitm-maroon hover:bg-smvitm-maroon hover:text-white',
  ghost: 'bg-transparent hover:bg-smvitm-bg text-smvitm-textSecondary border-transparent',
  danger: 'bg-smvitm-error hover:bg-red-700 text-white border-transparent',
  gold: 'bg-smvitm-gold hover:bg-yellow-600 text-white border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-6 py-3 text-base rounded-md',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold border transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-smvitm-maroon focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
