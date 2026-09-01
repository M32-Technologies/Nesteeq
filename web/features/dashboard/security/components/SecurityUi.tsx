"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"

export const buttonBaseClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

export const primaryButtonClassName = `${buttonBaseClassName} bg-[#07584F] text-white hover:bg-[#064C44]`

export const outlineButtonClassName = `${buttonBaseClassName} border border-[#DDE3DF] bg-white text-[#111111] hover:bg-[#F7F8F5]`

export const dangerButtonClassName = `${buttonBaseClassName} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`

export const inputClassName =
  "h-10 w-full rounded-lg border border-[#DDE3DF] bg-white px-3 text-sm text-[#111111] outline-none transition-colors placeholder:text-[#7C8782] focus:border-[#07584F] focus:ring-2 focus:ring-[#07584F]/15"

export const selectClassName = inputClassName

export const textareaClassName =
  "min-h-20 w-full rounded-lg border border-[#DDE3DF] bg-white px-3 py-2 text-sm text-[#111111] outline-none transition-colors placeholder:text-[#7C8782] focus:border-[#07584F] focus:ring-2 focus:ring-[#07584F]/15"

export const panelClassName =
  "rounded-lg border border-[#DDE3DF] bg-white p-5"

export const tableWrapClassName =
  "overflow-x-auto rounded-lg border border-[#DDE3DF] bg-white"

export const tableClassName =
  "w-full min-w-[1050px] text-left text-sm"

export const thClassName =
  "border-b border-[#DDE3DF] px-4 py-3 text-xs font-semibold uppercase text-[#637083]"

export const tdClassName =
  "border-b border-[#EEF1F4] px-4 py-3 align-top text-[#111111]"

const statusToneClassNames: Record<string, string> = {
  UPCOMING: "bg-blue-50 text-blue-700 ring-blue-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  EXITED: "bg-slate-100 text-slate-700 ring-slate-200",
  WAITING: "bg-amber-50 text-amber-700 ring-amber-100",
  NOTIFIED: "bg-blue-50 text-blue-700 ring-blue-100",
  COLLECTED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  RETURNED: "bg-slate-100 text-slate-700 ring-slate-200",
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  OCCUPIED: "bg-amber-50 text-amber-700 ring-amber-100",
  RESERVED: "bg-blue-50 text-blue-700 ring-blue-100",
  OUT_OF_SERVICE: "bg-red-50 text-red-700 ring-red-100",
  ACKNOWLEDGED: "bg-blue-50 text-blue-700 ring-blue-100",
  RESPONDING: "bg-amber-50 text-amber-700 ring-amber-100",
  RESOLVED: "bg-slate-100 text-slate-700 ring-slate-200",
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString()
}

export function formatLabel(value?: string | null) {
  if (!value) return "-"

  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ")
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        statusToneClassNames[status] ??
        "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {formatLabel(status)}
    </span>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-[#DDE3DF] bg-white p-8 text-center">
      <p className="font-semibold text-[#111111]">{title}</p>
      <p className="mt-1 text-sm text-[#637083]">
        {description}
      </p>
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-[#DDE3DF] bg-white px-4 py-3 text-sm text-[#637083]">
      {label}
    </p>
  )
}

export function ErrorState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {label}
    </p>
  )
}

export function PaginationControls({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
}: {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        className={outlineButtonClassName}
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      <span className="text-sm text-[#637083]">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className={outlineButtonClassName}
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

export function DetailModal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[#DDE3DF] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111111]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#637083]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Close details"
            className="rounded-lg p-2 text-[#637083] transition hover:bg-[#F7F8F5]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function DetailGrid({
  items,
}: {
  items: Array<{
    label: string
    value: ReactNode
  }>
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-3"
        >
          <dt className="text-xs font-semibold uppercase text-[#637083]">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-[#111111]">
            {item.value || "-"}
          </dd>
        </div>
      ))}
    </dl>
  )
}
