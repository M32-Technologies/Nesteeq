"use client"

import { useState } from "react"
import {
  Calendar,
  ImageIcon,
  Layers,
  Maximize2,
  Wrench,
  X,
} from "lucide-react"

import type { JobDetails } from "../services/jobs.service"

type ComplaintInfoCardProps = {
  jobId: string
  complaintInfo: JobDetails["complaintInfo"]
  formatDate: (dateString?: string) => string
}

export default function ComplaintInfoCard({
  jobId,
  complaintInfo,
  formatDate,
}: ComplaintInfoCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
          <Wrench size={16} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Complaint Information
        </h3>
      </div>

      <div className="mt-4 space-y-3.5 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Issue / Title
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {complaintInfo.title}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Description
          </p>
          <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-slate-700">
            {complaintInfo.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Category
            </p>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-700">
              <Layers size={14} className="text-slate-400" />
              <span>{complaintInfo.category}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Reported Date
            </p>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-700">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(complaintInfo.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Attached Complaint Image Evidence */}
        {complaintInfo.complaintImage && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                <ImageIcon size={13} />
                <span>Resident Attached Photo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                <Maximize2 size={12} />
                Enlarge
              </button>
            </div>
            <div
              onClick={() => setIsImageModalOpen(true)}
              className="group relative mt-2 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:border-[#0F5F45]/50 shadow-sm"
            >
              <img
                src={complaintInfo.complaintImage}
                alt={complaintInfo.title}
                className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
                  <Maximize2 size={13} /> Click to expand
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {isImageModalOpen && complaintInfo.complaintImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-[#0F5F45]" />
                <span className="text-sm font-semibold text-slate-900">
                  Complaint Attachment • {jobId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 bg-slate-900">
              <img
                src={complaintInfo.complaintImage}
                alt={complaintInfo.title}
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
              {complaintInfo.title} • Attached by resident
            </div>
          </div>
        </div>
      )}
    </div>
  )
}