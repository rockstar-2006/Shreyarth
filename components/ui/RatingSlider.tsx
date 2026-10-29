'use client';

import { cn } from '@/lib/utils';

interface RatingSliderProps {
  nomineeId: string;
  value: number;
  onChange: (nomineeId: string, value: number) => void;
  disabled?: boolean;
  label?: string;
}

export function RatingSlider({
  nomineeId,
  value,
  onChange,
  disabled = false,
  label,
}: RatingSliderProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={`rating-${nomineeId}`}
          className="block text-sm font-medium text-smvitm-textSecondary mb-1"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <input
          id={`rating-${nomineeId}`}
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          disabled={disabled}
          aria-label={`Rating for nominee: ${label ?? nomineeId}`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={value}
          onChange={(e) => onChange(nomineeId, parseInt(e.target.value, 10))}
          className={cn(
            'flex-1 h-2 rounded-full appearance-none cursor-pointer',
            'accent-smvitm-maroon',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            background: `linear-gradient(to right, #8B1A3A ${(value - 1) * (100 / 9)}%, #E8E0D5 ${(value - 1) * (100 / 9)}%)`,
          }}
        />
        <span
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg',
            'bg-smvitm-maroon text-white',
            disabled && 'opacity-60'
          )}
          aria-hidden="true"
        >
          {value}
        </span>
      </div>
      <div className="flex justify-between text-xs text-smvitm-textSecondary mt-1">
        <span>1 (Low)</span>
        <span>10 (High)</span>
      </div>
    </div>
  );
}
