import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md animate-shimmer bg-[#EFE8DC]/80',
        className
      )}
      {...props}
    />
  );
}

/**
 * Pre-built table skeleton loader
 */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden animate-fade-in">
      <div className="bg-[#FAF7F2] border-b border-[#E2D9CE] px-4 py-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton 
            key={`th-${i}`} 
            className={cn(
              'h-4',
              i === 0 ? 'w-8' : i === 1 ? 'w-44' : i === cols - 1 ? 'w-24 ml-auto' : 'w-28'
            )} 
          />
        ))}
      </div>
      <div className="divide-y divide-[#E2D9CE]/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="px-4 py-3.5 flex items-center gap-4 bg-white/70">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={`td-${r}-${c}`}
                className={cn(
                  'h-4',
                  c === 0 ? 'w-8' : c === 1 ? 'w-48' : c === cols - 1 ? 'w-20 ml-auto' : 'w-28'
                )}
                style={{
                  animationDelay: `${(r * cols + c) * 40}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-built card grid skeleton loader
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skel-${i}`}
          className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-card flex flex-col space-y-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32 col-span-2" />
          </div>
          <div className="pt-3 border-t border-[#E2D9CE]/60 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
