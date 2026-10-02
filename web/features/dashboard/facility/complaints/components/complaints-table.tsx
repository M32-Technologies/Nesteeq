"use client"

import { useEffect, useState } from "react"
import { Eye, MoreVertical, Pencil, UserCheck } from "lucide-react"

import type { Complaint } from "@/features/dashboard/facility/complaints/types/complaints.types"
import {
  formatDate,
  formatId,
  formatLabel,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export type ComplaintDrawerMode = "details" | "assign" | "edit" | "status"

export function ComplaintsTable({
  complaints,
  onSelectComplaint,
}: {
  complaints: Complaint[]
  onSelectComplaint: (id: string, mode?: ComplaintDrawerMode) => void
}) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const handleOpenDrawer = (
    complaint: Complaint,
    mode: ComplaintDrawerMode = "details"
  ) => {
    onSelectComplaint(complaint._id, mode)
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
        <table className="w-full min-w-[1120px] text-left">
          <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-4 py-3">Sl No</th>
              <th className="px-4 py-3">Resident</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {complaints.map((complaint, index) => (
              <tr
                key={complaint._id}
                onClick={() => handleOpenDrawer(complaint)}
                className="cursor-pointer text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
              >
                <td className="px-4 py-4 font-semibold text-[#111111]">
                  {index + 1}
                </td>
                <td className="px-4 py-4">{formatId(typeof complaint.residentId === "object" ? complaint.residentId?.name : complaint.residentId)}</td>
                <td className="px-4 py-4">{formatLabel(complaint.category)}</td>
                <td className="max-w-[260px] px-4 py-4">
                  <div className="truncate font-medium text-[#111111]">
                    {complaint.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                    {complaint.description}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={complaint.priority} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={complaint.status} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  {formatDate(complaint.createdAt)}
                </td>
                <td className="px-4 py-4 text-[13px] text-[#26313D]">
                  {typeof complaint.assignedStaff === 'object' && complaint.assignedStaff?.name
                    ? complaint.assignedStaff.name
                    : complaint.assignedTechnicianName || (typeof complaint.assignedStaff === 'string' ? '-' : 'Not assigned')}
                </td>
                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === complaint._id ? null : complaint._id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === complaint._id && (
                      <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenDrawer(complaint, "details");
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
                            handleOpenDrawer(complaint, "assign");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#5542F6] hover:bg-[#F5F3FF]"
                        >
                          <UserCheck className="h-4 w-4 text-[#5542F6]" />
                          <span>Assign Technician</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenDrawer(complaint, "edit");
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
        {complaints.map((complaint, index) => (
          <article
            key={complaint._id}
            onClick={() => handleOpenDrawer(complaint, "details")}
            className="cursor-pointer p-4 transition hover:bg-[#FBFCFD]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  #{index + 1}
                </p>
                <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                  {complaint.title}
                </h2>
              </div>
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === complaint._id ? null : complaint._id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === complaint._id && (
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenDrawer(complaint, "details");
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
                          handleOpenDrawer(complaint, "assign");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#5542F6] hover:bg-[#F5F3FF]"
                      >
                        <UserCheck className="h-4 w-4 text-[#5542F6]" />
                        <span>Assign Technician</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenDrawer(complaint, "edit");
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
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
              <span>{formatLabel(complaint.category)}</span>
              <span>{formatDate(complaint.createdAt)}</span>
              {(() => {
                const staff = typeof complaint.assignedStaff === "object" ? complaint.assignedStaff : null
                const to = typeof complaint.assignedTo === "object" ? complaint.assignedTo : null
                const techName =
                  staff?.name ||
                  staff?.fullName ||
                  complaint.assignedTechnicianName ||
                  to?.name ||
                  to?.fullName
                return techName ? (
                  <span>
                    Technician: <strong className="font-medium text-[#111111]">{techName}</strong>
                  </span>
                ) : null
              })()}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
