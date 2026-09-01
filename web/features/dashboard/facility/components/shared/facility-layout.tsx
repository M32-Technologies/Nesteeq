import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"

import { cn } from "./facility-formatters"

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

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] p-4 lg:flex-row lg:items-center">
      {children}
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
