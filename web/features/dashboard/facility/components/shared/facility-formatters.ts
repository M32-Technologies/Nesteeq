import type { Priority } from "../../facility.types"

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
