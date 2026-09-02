"use client"

import { useState } from "react"
import {
  Building2,
  ChevronDown,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"

import type {
  PropertyBlock,
  PropertyBlockFilterStatus,
  PropertyBlockStatus,
} from "../types/property"
import BlockActionDialog from "./block-action-dialog"

type BlocksTableSectionProps = {
  blocks: PropertyBlock[]
  blockStatus: PropertyBlockFilterStatus
  blockSearch: string
  isLoading: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: PropertyBlockFilterStatus) => void
}

const statusStyles: Record<PropertyBlockStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-600",
}

export default function BlocksTableSection({
  blocks,
  blockStatus,
  blockSearch,
  isLoading,
  onSearchChange,
  onStatusChange,
}: BlocksTableSectionProps) {
  const [openActionBlockId, setOpenActionBlockId] = useState<string | null>(
    null
  )
  const [selectedBlock, setSelectedBlock] = useState<PropertyBlock | null>(null)
  const [dialogMode, setDialogMode] = useState<
    "edit" | "deactivate" | "activate" | null
  >(null)

  const openBlockDialog = (
    block: PropertyBlock,
    mode: "edit" | "deactivate" | "activate"
  ) => {
    setSelectedBlock(block)
    setDialogMode(mode)
    setOpenActionBlockId(null)
  }

  const closeBlockDialog = () => {
    setSelectedBlock(null)
    setDialogMode(null)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={blockSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search block name or code..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          <div className="relative w-full lg:w-[180px]">
            <select
              value={blockStatus}
              onChange={(event) =>
                onStatusChange(event.target.value as PropertyBlockFilterStatus)
              }
              className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="all">All Blocks</option>
              <option value="active">Active Blocks</option>
              <option value="inactive">Inactive Blocks</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[9%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[17%]" />
            <col className="w-[8%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Block
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Floors
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Updated
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {!isLoading &&
              blocks.map((block) => {
                const updatedAt = block.updatedAt
                  ? new Intl.DateTimeFormat("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(block.updatedAt))
                  : "-"

                return (
                  <tr key={block.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0F5F45]">
                          <Building2 size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {block.blockname}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-semibold text-slate-700">
                      {block.code}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-medium text-slate-600">
                      {block.totalFloors}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[block.status]}`}
                      >
                        {block.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-medium text-slate-600">
                      {updatedAt}
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionBlockId((currentBlockId) =>
                              currentBlockId === block.id ? null : block.id
                            )
                          }
                          aria-expanded={openActionBlockId === block.id}
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionBlockId === block.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                            {block.status === "active" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openBlockDialog(block, "edit")}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Pencil size={15} />
                                  Edit block
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() =>
                                    openBlockDialog(block, "deactivate")
                                  }
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 size={15} />
                                  Deactivate
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openBlockDialog(block, "activate")
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <CheckCircle2 size={15} />
                                Activate block
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        {isLoading && (
          <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
            Loading blocks...
          </div>
        )}

        {!isLoading && blocks.length === 0 && (
          <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
            No blocks found
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-sm font-medium text-slate-500">
          {blocks.length}{" "}
          {blockStatus === "all" ? "total" : blockStatus} blocks
        </p>
      </div>
      </div>

      <BlockActionDialog
        block={selectedBlock}
        mode={dialogMode}
        onClose={closeBlockDialog}
      />
    </>
  )
}
