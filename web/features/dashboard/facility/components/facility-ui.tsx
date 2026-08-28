import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  Clock3,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

import type {
  ActivityNote,
  ComplaintStatus,
  MaintenanceProgressUpdate,
  MaintenanceStatus,
  Priority,
} from "../facility.types"

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function formatLabel(value?: string | null) {
  if (!value) return "Not set"

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not set"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return "Not set"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatId(value?: string | null) {
  if (!value) return "Not set"
  if (value.length <= 10) return value

  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function priorityWeight(priority?: Priority | null) {
  if (priority === "URGENT") return 4
  if (priority === "HIGH") return 3
  if (priority === "MEDIUM") return 2
  if (priority === "LOW") return 1

  return 0
}

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

export function PageHeader({
  title,
  eyebrow,
  actions,
}: {
  title: string
  eyebrow: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#07584F]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#111111] sm:text-[34px]">
          {title}
        </h1>
      </div>

      {actions}
    </div>
  )
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone = "green",
}: {
  title: string
  value?: number
  icon: LucideIcon
  tone?: "green" | "blue" | "amber" | "rose" | "gray"
}) {
  const toneClass = {
    green: "bg-[#EAF4F0] text-[#07584F]",
    blue: "bg-[#EEF6FF] text-[#2E639B]",
    amber: "bg-[#FFF8EA] text-[#946415]",
    rose: "bg-[#FFF0F0] text-[#A23D3D]",
    gray: "bg-[#F3F5F7] text-[#687481]",
  }[tone]

  return (
    <div className="rounded-lg border border-[#E2E8EE] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[#66737F]">{title}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            toneClass
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#111111]">
        {value ?? "-"}
      </p>
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8793A0]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white pl-9 pr-3 text-[13px] text-[#111111] outline-none transition placeholder:text-[#8793A0] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
      />
    </label>
  )
}

export function FilterSelect<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: "all" | TValue
  options: readonly TValue[]
  onChange: (value: "all" | TValue) => void
}) {
  return (
    <label className="block min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as "all" | TValue)}
        className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
      >
        <option value="all">All {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] p-4 lg:flex-row lg:items-center">
      {children}
    </div>
  )
}

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

export function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 bg-[#071D35]/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col bg-white shadow-[-18px_0_50px_rgba(7,29,53,0.18)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E2E8EE] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#07584F]">
              Details
            </p>
            <h2 className="mt-1 truncate text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 truncate text-[13px] text-[#66737F]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </aside>
    </div>
  )
}

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-[#E8EDF2] py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="text-[15px] font-semibold text-[#111111]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function InfoGrid({
  items,
}: {
  items: Array<{
    label: string
    value: ReactNode
  }>
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-[13px] font-medium text-[#26313D]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TextArea({
  name,
  placeholder,
  required,
  minLength,
  defaultValue,
}: {
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  defaultValue?: string | null
}) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      defaultValue={defaultValue ?? ""}
      rows={3}
      className="w-full resize-none rounded-lg border border-[#DDE5EC] bg-white px-3 py-2.5 text-[13px] text-[#111111] outline-none transition placeholder:text-[#9AA5AF] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
    />
  )
}

export function TextInput({
  name,
  placeholder,
  type = "text",
  required,
  minLength,
  defaultValue,
}: {
  name: string
  placeholder?: string
  type?: "text" | "number" | "date" | "time"
  required?: boolean
  minLength?: number
  defaultValue?: string | number | null
}) {
  return (
    <input
      name={name}
      placeholder={placeholder}
      type={type}
      required={required}
      minLength={minLength}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? "0.01" : undefined}
      defaultValue={defaultValue ?? ""}
      className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] text-[#111111] outline-none transition placeholder:text-[#9AA5AF] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
    />
  )
}

export function FormSelect<TValue extends string>({
  name,
  options,
  defaultValue,
  required,
}: {
  name: string
  options: readonly TValue[]
  defaultValue?: TValue
  required?: boolean
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      required={required}
      className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatLabel(option)}
        </option>
      ))}
    </select>
  )
}

export function FormLabel({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-[#26313D]">
        {label}
      </span>
      {children}
    </label>
  )
}

export function SubmitButton({
  children,
  isLoading,
  tone = "primary",
}: {
  children: ReactNode
  isLoading?: boolean
  tone?: "primary" | "danger" | "secondary"
}) {
  const toneClass = {
    primary: "bg-[#07584F] text-white hover:bg-[#064C44]",
    danger: "bg-[#A23D3D] text-white hover:bg-[#8F3333]",
    secondary:
      "border border-[#DDE5EC] bg-white text-[#26313D] hover:border-[#07584F] hover:text-[#07584F]",
  }[tone]

  return (
    <button
      type="submit"
      disabled={isLoading}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        toneClass
      )}
    >
      {isLoading ? <RefreshCw className="size-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

export function ActivityTimeline({
  notes,
  progress,
}: {
  notes?: ActivityNote[]
  progress?: MaintenanceProgressUpdate[]
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
