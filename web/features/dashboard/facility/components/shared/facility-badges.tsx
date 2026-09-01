import type {
  ComplaintStatus,
  MaintenanceStatus,
  Priority,
} from "../../facility.types"
import { cn, formatLabel } from "./facility-formatters"

const statusTone: Record<string, string> = {
  SCHEDULED: "border-[#BFD8F7] bg-[#EEF6FF] text-[#2E639B]",
  PENDING: "border-[#F2D39A] bg-[#FFF8EA] text-[#946415]",
  UNDER_REVIEW: "border-[#BFD8F7] bg-[#EEF6FF] text-[#2E639B]",
  ASSIGNED: "border-[#C7D8E8] bg-[#F0F6FB] text-[#365D7B]",
  IN_PROGRESS: "border-[#A8D8CF] bg-[#EAF7F4] text-[#07584F]",
  ON_HOLD: "border-[#F2D39A] bg-[#FFF8EA] text-[#946415]",
  WORK_COMPLETED: "border-[#BFD8F7] bg-[#EEF6FF] text-[#2E639B]",
  AWAITING_APPROVAL: "border-[#D5C4F0] bg-[#F6F0FF] text-[#65459B]",
  APPROVED: "border-[#B6DEC5] bg-[#EDF8F0] text-[#26733E]",
  REJECTED: "border-[#F0C0C0] bg-[#FFF0F0] text-[#A23D3D]",
  CANCELLED: "border-[#D6DCE3] bg-[#F3F5F7] text-[#687481]",
  RESCHEDULED: "border-[#D5C4F0] bg-[#F6F0FF] text-[#65459B]",
  COMPLETED: "border-[#B6DEC5] bg-[#EDF8F0] text-[#26733E]",
  CLOSED: "border-[#C8CDD3] bg-[#EEF0F2] text-[#4B5561]",
}

const priorityTone: Record<Priority, string> = {
  LOW: "border-[#D6DCE3] bg-[#F3F5F7] text-[#687481]",
  MEDIUM: "border-[#BFD8F7] bg-[#EEF6FF] text-[#2E639B]",
  HIGH: "border-[#F2D39A] bg-[#FFF8EA] text-[#946415]",
  URGENT: "border-[#F0C0C0] bg-[#FFF0F0] text-[#A23D3D]",
}

export function StatusBadge({
  status,
}: {
  status: ComplaintStatus | MaintenanceStatus | string
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold",
        statusTone[status] || statusTone.PENDING
      )}
    >
      {formatLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold",
        priorityTone[priority]
      )}
    >
      {formatLabel(priority)}
    </span>
  )
}
