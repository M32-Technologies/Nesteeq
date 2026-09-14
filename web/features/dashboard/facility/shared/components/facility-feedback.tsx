import {
  AlertCircle,
  Clock3,
  RefreshCw,
} from "lucide-react"

import { cn } from "@/features/dashboard/facility/shared/components/facility-formatters"

export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#EEF2F5]">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid gap-3 p-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((__, itemIndex) => (
            <div
              key={itemIndex}
              className="h-4 animate-pulse rounded bg-[#EEF2F5]"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-md bg-[#EEF4F7] text-[#5579B8]">
        <Clock3 className="size-5" />
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-[#111111]">
        {title}
      </h2>
      <p className="mt-2 max-w-[360px] text-[13px] leading-6 text-[#66737F]">
        {message}
      </p>
    </div>
  )
}

export function ErrorState({
  title,
  message,
  isRetrying,
  onRetry,
}: {
  title: string
  message: string
  isRetrying?: boolean
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-md bg-[#FFF0F0] text-[#A23D3D]">
        <AlertCircle className="size-5" />
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-[#111111]">
        {title}
      </h2>
      <p className="mt-2 max-w-[400px] text-[13px] leading-6 text-[#66737F]">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064C44] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
        Retry
      </button>
    </div>
  )
}
