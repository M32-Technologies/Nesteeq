import type { ReactNode } from "react"
import {
  RefreshCw,
  Search,
} from "lucide-react"

import { cn, formatLabel } from "@/features/dashboard/facility/shared/components/facility-formatters"

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
        <option value="all">All {formatLabel(label)}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SortSelect<TValue extends string>({
  label = "sort",
  value,
  options,
  onChange,
}: {
  label?: string
  value: TValue
  options: readonly TValue[]
  onChange: (value: TValue) => void
}) {
  return (
    <label className="block min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            Sort by {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
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
