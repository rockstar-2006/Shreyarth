import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-smvitm-text mb-1">
            {label}
            {props.required && <span className="text-smvitm-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-md px-3 py-2 text-smvitm-text bg-smvitm-surface',
            'focus:outline-none focus:ring-2 focus:ring-smvitm-maroon focus:border-transparent',
            'placeholder:text-smvitm-textSecondary text-sm',
            'disabled:opacity-50 disabled:bg-smvitm-bg',
            error ? 'border-smvitm-error' : 'border-smvitm-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-smvitm-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-smvitm-textSecondary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
