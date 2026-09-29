import React from "react";

export function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="divide-y divide-slate-100/90"
      aria-label="Loading notifications"
      role="status"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3.5 px-4 py-3.5"
        >
          {/* Severity Icon Skeleton */}
          <div className="size-9 shrink-0 rounded-xl bg-slate-100 animate-pulse mt-0.5" />

          {/* Text skeletons */}
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-3">
              <div
                className="h-3.5 rounded-md bg-slate-200/80 animate-pulse"
                style={{ width: `${55 + (idx % 3) * 15}%` }}
              />
              <div className="h-3 w-12 rounded bg-slate-100 animate-pulse shrink-0" />
            </div>
            <div
              className="h-3 rounded-md bg-slate-100 animate-pulse"
              style={{ width: `${85 - (idx % 2) * 15}%` }}
            />
            <div className="flex items-center gap-2 pt-0.5">
              <div className="h-2.5 w-14 rounded bg-slate-100 animate-pulse" />
              <div className="h-2.5 w-10 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  );
}
