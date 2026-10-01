"use client"

import { useEffect, useState } from "react"
import { Eye, MoreVertical, Pencil, UserCheck } from "lucide-react"

import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import {
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function MaintenanceTable({
  maintenance,
  onSelectMaintenance,
}: {
  maintenance: Maintenance[]
  onSelectMaintenance: (id: string, mode?: "details" | "assign" | "edit") => void
}) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const handleOpenDrawer = (
    item: Maintenance,
    mode: "details" | "assign" | "edit" = "details"
  ) => {
    onSelectMaintenance(item._id, mode)
  }

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    if (activeMenuId) {
      document.addEventListener("click", handleOutsideClick)
      return () => document.removeEventListener("click", handleOutsideClick)
    }
  }, [activeMenuId])

  return (
    <>
      <div className="hidden min-h-[300px] overflow-x-auto pb-28 lg:block">
        <table className="w-full min-w-[1240px] text-left">
          <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-4 py-3">Maintenance ID</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {maintenance.map((item) => (
              <tr
                key={item._id}
                onClick={() => handleOpenDrawer(item, "details")}
                className="cursor-pointer text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
              >
                <td className="px-4 py-4 font-semibold text-[#111111]">
                  {formatId(item._id)}
                </td>
                <td className="px-4 py-4">{formatLabel(item.category)}</td>
                <td className="max-w-[260px] px-4 py-4">
                  <div className="truncate font-medium text-[#111111]">
                    {item.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                    {item.description}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {formatId(
                    typeof item.assignedTo === "object"
                      ? item.assignedTo?._id
                      : item.assignedTo
                  )}
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  <div>Estimate: {formatCurrency(item.estimatedCost)}</div>
                  <div className="mt-1">
                    Actual: {formatCurrency(item.finalCost)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  <div>{formatDate(item.createdAt)}</div>
                </td>
                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                      aria-label="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === item._id && (
                      <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenDrawer(item, "details");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenDrawer(item, "assign");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#5542F6] hover:bg-[#F5F3FF]"
                        >
                          <UserCheck className="h-4 w-4 text-[#5542F6]" />
                          <span>Assign Technision</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenDrawer(item, "edit");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#EEF2F5] pb-28 lg:hidden">
        {maintenance.map((item) => (
          <article
            key={item._id}
            onClick={() => handleOpenDrawer(item, "details")}
            className="cursor-pointer p-4 transition hover:bg-[#FBFCFD]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  {formatId(item._id)}
                </p>
                <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                  {item.title}
                </h2>
              </div>
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === item._id && (
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenDrawer(item, "details");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenDrawer(item, "assign");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#5542F6] hover:bg-[#F5F3FF]"
                      >
                        <UserCheck className="h-4 w-4 text-[#5542F6]" />
                        <span>Assign Technision</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenDrawer(item, "edit");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
            </div>
            <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
              <span>{formatLabel(item.category)}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
