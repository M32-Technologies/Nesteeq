import type {
  ActivityNote,
} from "@/features/dashboard/facility/shared/types/common.types"
import {
  formatDate,
  formatId,
  formatLabel,
} from "@/features/dashboard/facility/shared/components/facility-formatters"

export function ActivityTimeline({
  notes,
  progress,
}: {
  notes?: ActivityNote[]
  progress?: Array<{
    createdAt: string
    by: string
    details: string
    status: string
  }>
}) {
  const items = [
    ...(notes ?? []).map((note) => ({
      id: `${note.createdAt}-${note.by}-${note.message}`,
      title: note.message,
      meta: `${formatLabel(note.role)} - ${formatId(note.by)}`,
      createdAt: note.createdAt,
    })),
    ...(progress ?? []).map((item) => ({
      id: `${item.createdAt}-${item.by}-${item.details}`,
      title: item.details,
      meta: `${formatLabel(item.status)} - ${formatId(item.by)}`,
      createdAt: item.createdAt,
    })),
  ].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
        No activity recorded.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#07584F]" />
          <div className="min-w-0 flex-1">
            <p className="break-words text-[13px] font-medium leading-5 text-[#26313D]">
              {item.title}
            </p>
            <p className="mt-1 text-[12px] text-[#8793A0]">
              {item.meta} - {formatDate(item.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
