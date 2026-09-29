import React from "react";

export function NotificationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="divide-y divide-slate-100"
      aria-label="Loading notifications"
      role="status"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3.5 transition-colors"
        >
          {/* Avatar / Icon skeleton */}
          <div className="size-8 shrink-0 rounded-full bg-slate-200/70 animate-pulse" />

          {/* Text skeletons */}
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div
                className="h-3.5 rounded bg-slate-200/80 animate-pulse"
                style={{ width: `${60 + (idx % 3) * 15}%` }}
              />
              <div className="h-2.5 w-12 rounded bg-slate-200/60 animate-pulse shrink-0" />
            </div>
            <div
              className="h-3 rounded bg-slate-200/60 animate-pulse"
              style={{ width: `${80 - (idx % 2) * 15}%` }}
            />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  );
}
