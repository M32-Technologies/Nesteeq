"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  CheckCircle2,
  Loader2,
  Receipt,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  approveMaintenanceCost,
  fetchMaintenance,
  rejectMaintenanceCost,
} from "@/features/dashboard/facility/maintenance/api/maintenance.api"
import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { useTechniciansQuery } from "@/features/dashboard/facility/technicians/hooks/use-technicians-queries"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"

export type PendingExpenseItem = Maintenance & {
  submittedAmount?: number | null
  materialDescription?: string | null
  expenseDescription?: string | null
  expenseReceiptUrl?: string | null
  expenseStatus?: string | null
  expenseAmount?: number | null
}

type PendingExpenseApprovalsPanelProps = {
  initialExpenses?: PendingExpenseItem[]
}

function resolveCostAmount(item: any): number {
  const value =
    item.submittedAmount ??
    item.costReview?.submittedAmount ??
    item.finalCost ??
    item.actualCost ??
    item.expenseAmount ??
    0
  const parsed = Number(value)
  return isNaN(parsed) ? 0 : parsed
}

function resolveMaterialDescription(item: any): string {
  return (
    item.materialDescription ||
    item.expenseDescription ||
    item.costReview?.remarks ||
    item.completionDetails?.workNotes ||
    item.completionDetails?.details ||
    item.workNotes ||
    item.description ||
    "No description provided"
  )
}

function isAwaitingCostApproval(item: any): boolean {
  const cost = resolveCostAmount(item)
  if (cost <= 0) return false

  const isApproved =
    item.expenseApproved === true ||
    item.expenseStatus === "APPROVED" ||
    item.costReview?.status === "APPROVED" ||
    item.costStatus === "APPROVED"

  const isRejected =
    item.expenseStatus === "REJECTED" ||
    item.costReview?.status === "REJECTED" ||
    item.costStatus === "REJECTED"

  if (isApproved || isRejected) return false

  return (
    item.costReview?.status === "SUBMITTED" ||
    item.costStatus === "SUBMITTED" ||
    item.expenseStatus === "PENDING_FACILITY_APPROVAL" ||
    item.expenseApproved === false ||
    item.status === "AWAITING_APPROVAL" ||
    item.status === "WORK_COMPLETED"
  )
}

function ExpenseItemCard({
  item,
  technicianName,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: PendingExpenseItem
  technicianName: string
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const [isRejectingOpen, setIsRejectingOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const amount = resolveCostAmount(item)
  const description = resolveMaterialDescription(item)

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason")
      return
    }
    onReject(item._id || (item as any).id, rejectionReason.trim())
    setIsRejectingOpen(false)
    setRejectionReason("")
  }

  return (
    <div className="space-y-3 p-4 transition-colors hover:bg-slate-50/50">
      {/* Title, Category & Technician */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="truncate text-sm font-bold text-[#111111]">
              {item.title}
            </h4>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {item.category}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            Technician:{" "}
            <span className="font-semibold text-slate-700">
              {technicianName}
            </span>
          </p>
        </div>
      </div>

      {/* Submitted Amount and Material Description Boxes */}
      <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-[#E8EDF2] bg-[#F8FAFC] p-2.5">
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Submitted Amount
          </span>
          <div className="mt-0.5 text-base font-bold text-[#111111]">
            ₹ {amount.toFixed(2)}
          </div>
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Material / Item Description
          </span>
          <p
            className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-800"
            title={description}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Inline Rejection Prompt */}
      {isRejectingOpen ? (
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 p-2.5">
          <label className="block text-[11px] font-semibold text-rose-900">
            Rejection Reason (Required)
          </label>
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Receipt missing, invalid parts cost..."
            className="w-full rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmReject()
              if (e.key === "Escape") setIsRejectingOpen(false)
            }}
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRejectingOpen(false)
                setRejectionReason("")
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={handleConfirmReject}
              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="size-3" />
                  Confirm Reject
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isApproving || isRejecting}
            onClick={() => setIsRejectingOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs hover:border-rose-300 hover:bg-rose-50 transition disabled:opacity-50"
          >
            <X className="size-3.5" />
            <span>Reject</span>
          </button>
          <button
            type="button"
            disabled={isApproving || isRejecting}
            onClick={() => onApprove(item._id || (item as any).id)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isApproving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                <span>Approve</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export function PendingExpenseApprovalsPanel({
  initialExpenses,
}: PendingExpenseApprovalsPanelProps) {
  const queryClient = useQueryClient()
  const techniciansQuery = useTechniciansQuery()

  // Query maintenance tickets with active expenses
  const maintenanceQuery = useQuery({
    queryKey: ["facility-maintenance", "pending-expenses"],
    queryFn: () => fetchMaintenance({ limit: 100 }),
    staleTime: 15 * 1000,
  })

  // Map technician IDs to names
  const technicianNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of techniciansQuery.data?.technicians ?? []) {
      if (t.userId) map.set(String(t.userId), t.name)
      if (t._id) map.set(String(t._id), t.name)
      if (t.id) map.set(String(t.id), t.name)
    }
    return map
  }, [techniciansQuery.data?.technicians])

  // Aggregate pending expense items from maintenance list & initialExpenses
  const pendingExpenses = useMemo(() => {
    const itemMap = new Map<string, PendingExpenseItem>()

    // 1. Add any items from dashboard pendingActions
    if (initialExpenses && Array.isArray(initialExpenses)) {
      for (const item of initialExpenses) {
        if (isAwaitingCostApproval(item)) {
          itemMap.set(item._id || (item as any).id, item)
        }
      }
    }

    // 2. Add any items from maintenance list
    const maintList = maintenanceQuery.data?.maintenance ?? []
    for (const item of maintList) {
      if (isAwaitingCostApproval(item)) {
        itemMap.set(item._id || (item as any).id, item as PendingExpenseItem)
      }
    }

    return Array.from(itemMap.values())
  }, [initialExpenses, maintenanceQuery.data?.maintenance])

  // Mutation for approving expense
  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      approveMaintenanceCost(id, { notes: "Approved from Facility Dashboard" }),
    onSuccess: async () => {
      toast.success("Maintenance expense approved")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expense-approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenances"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to approve expense"))
    },
  })

  // Mutation for rejecting expense
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectMaintenanceCost(id, { reason }),
    onSuccess: async () => {
      toast.success("Maintenance expense rejected")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expense-approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenances"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to reject expense"))
    },
  })

  const getTechnicianName = (item: PendingExpenseItem): string => {
    if (typeof item.assignedTo === "object" && item.assignedTo?.name) {
      return item.assignedTo.name
    }
    const staffId =
      (item as any).assignedStaff ||
      (typeof item.assignedTo === "string" ? item.assignedTo : "")
    if (staffId && technicianNameMap.has(String(staffId))) {
      return technicianNameMap.get(String(staffId))!
    }
    return "Assigned Technician"
  }

  const count = pendingExpenses.length

  return (
    <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Receipt className="size-4" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#111111]">
            Expense / Material Approvals
          </h2>
        </div>
        <span
          className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
            count > 0
              ? "border border-amber-200/60 bg-[#FFF8EA] text-[#946415]"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {count} pending
        </span>
      </div>

      {/* Body */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="text-xs font-medium text-slate-700">
            All technician expenses are reviewed and up to date
          </p>
          <p className="text-[11px] text-slate-400">
            Submitted material and repair costs will appear here for manager sign-off.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {pendingExpenses.map((item) => (
            <ExpenseItemCard
              key={item._id || (item as any).id}
              item={item}
              technicianName={getTechnicianName(item)}
              onApprove={(id) => approveMutation.mutate({ id })}
              onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
              isApproving={
                approveMutation.isPending &&
                approveMutation.variables?.id === (item._id || (item as any).id)
              }
              isRejecting={
                rejectMutation.isPending &&
                rejectMutation.variables?.id === (item._id || (item as any).id)
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
