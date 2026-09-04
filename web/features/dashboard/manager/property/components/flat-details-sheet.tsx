"use client"

import {
  Building2,
  CalendarDays,
  Home,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react"
import type { ReactNode } from "react"

import { usePropertyFlatDetailsQuery } from "../hooks/use-property-query"
import type {
  PropertyFlat,
  PropertyFlatStatus,
  PropertyOccupancyStatus,
} from "../types/property"

type FlatDetailsSheetProps = {
  flatId: string | null
  open: boolean
  onClose: () => void
  onEdit: (flat: PropertyFlat) => void
}

const occupancyStyles: Record<PropertyOccupancyStatus, string> = {
  VACANT: "bg-slate-100 text-slate-700",
  OWNER: "bg-blue-50 text-blue-700",
  TENANT: "bg-amber-50 text-amber-700",
}

const statusStyles: Record<PropertyFlatStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-600",
}

export default function FlatDetailsSheet({
  flatId,
  open,
  onClose,
  onEdit,
}: FlatDetailsSheetProps) {
  const {
    data: flat,
    isLoading,
    isError,
    error,
    refetch,
  } = usePropertyFlatDetailsQuery(flatId, open)

  if (!open) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close flat details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/20 lg:hidden"
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.08)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <h2 className="text-base font-semibold text-slate-900">
            Flat Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <DetailsSkeleton />
          ) : isError ? (
            <DetailsError
              message={
                error instanceof Error
                  ? error.message
                  : "Failed to load flat details"
              }
              onRetry={() => refetch()}
            />
          ) : flat ? (
            <div className="flex min-h-full flex-col">
              <div className="shrink-0 border-b border-slate-100 px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
                      <Home size={18} />
                    </div>

                    <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onEdit(flat)}
                      disabled={flat.status !== "active"}
                      className="block max-w-full truncate text-left text-2xl font-semibold leading-7 text-slate-950 transition hover:text-[#0F5F45] disabled:cursor-default disabled:hover:text-slate-950"
                    >
                      {flat.flatNumber}
                    </button>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {flat.block?.blockname ?? flat.blockId} | Floor{" "}
                        {flat.floorNumber || "-"}
                      </p>
                    </div>
                  </div>

                  {flat.status === "active" && (
                    <button
                      type="button"
                      onClick={() => onEdit(flat)}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={flat.status} />
                  <OccupancyBadge status={flat.occupancyStatus} />
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <DetailSection title="Flat Information">
                  <DetailRow
                    icon={<Home size={16} />}
                    label="Flat Number"
                    value={flat.flatNumber}
                  />
                  <DetailRow
                    icon={<Building2 size={16} />}
                    label="Block"
                    value={flat.block?.blockname ?? flat.blockId}
                  />
                  <DetailRow
                    icon={<Building2 size={16} />}
                    label="Block Code"
                    value={flat.block?.code ?? "-"}
                  />
                  <DetailRow
                    icon={<Home size={16} />}
                    label="Floor"
                    value={`Floor ${flat.floorNumber || "-"}`}
                  />
                </DetailSection>

                <DetailSection title="Occupancy">
                  <DetailRow
                    icon={<UserRound size={16} />}
                    label="Occupancy Status"
                    value={formatOccupancy(flat.occupancyStatus)}
                  />

                  {flat.resident ? (
                    <div className="border-t border-slate-100 py-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Resident
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {flat.resident.name}
                      </p>
                      {flat.resident.email && (
                        <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Mail size={14} />
                          <span className="min-w-0 truncate">
                            {flat.resident.email}
                          </span>
                        </p>
                      )}
                      {flat.resident.phone && (
                        <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Phone size={14} />
                          {flat.resident.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 py-3">
                      <p className="text-base font-semibold text-slate-900">
                        Vacant
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        No resident assigned
                      </p>
                    </div>
                  )}
                </DetailSection>

                <DetailSection title="Record">
                  <DetailRow
                    icon={<CalendarDays size={16} />}
                    label="Created"
                    value={formatDate(flat.createdAt)}
                  />
                  <DetailRow
                    icon={<RefreshCw size={16} />}
                    label="Updated"
                    value={formatDate(flat.updatedAt)}
                  />
                </DetailSection>
              </div>

              {flat.status === "active" && (
                <div className="shrink-0 border-t border-slate-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => onEdit(flat)}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0F5F45] text-sm font-semibold text-white transition hover:bg-[#0B4D38]"
                  >
                    <Pencil size={15} />
                    Edit Flat
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-1.5">
      <div className="border-b border-slate-100 py-2.5">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      {children}
    </section>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex shrink-0 items-center gap-2.5 text-slate-500">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="min-w-0 text-right text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  )
}

function OccupancyBadge({ status }: { status: PropertyOccupancyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${occupancyStyles[status]}`}
    >
      {formatOccupancyBadge(status)}
    </span>
  )
}

function StatusBadge({ status }: { status: PropertyFlatStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  )
}

function DetailsSkeleton() {
  return (
    <div className="space-y-5 p-5">
      <div>
        <div className="h-6 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="rounded-lg border border-slate-200 p-4">
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailsError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <X size={20} className="text-red-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        Unable to load flat
      </h3>
      <p className="mt-1 max-w-[260px] text-sm text-slate-500">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  )
}

function formatOccupancy(status: PropertyOccupancyStatus) {
  if (status === "OWNER") return "Owner"
  if (status === "TENANT") return "Tenant"
  return "Vacant"
}

function formatOccupancyBadge(status: PropertyOccupancyStatus) {
  if (status === "OWNER") return "Owner Occupied"
  if (status === "TENANT") return "Tenant Occupied"
  return "Vacant"
}

function formatDate(date?: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}
