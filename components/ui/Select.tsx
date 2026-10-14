import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? `select-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-smvitm-text mb-1">
            {label}
            {props.required && <span className="text-smvitm-error ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-md px-3 py-2 text-smvitm-text bg-smvitm-surface',
            'focus:outline-none focus:ring-2 focus:ring-smvitm-maroon focus:border-transparent',
            'disabled:opacity-50 disabled:bg-smvitm-bg text-sm',
            error ? 'border-smvitm-error' : 'border-smvitm-border',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-smvitm-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-smvitm-textSecondary">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
