"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Check, ChevronDown, Loader2, Search, UserRound } from "lucide-react"

import { useTechniciansQuery } from "@/features/dashboard/facility/technicians/hooks/use-technicians-queries"
import type { Technician } from "@/features/dashboard/facility/technicians/types/technicians.types"

export interface TechnicianSelectProps {
  technicians?: Technician[]
  isLoading?: boolean
  defaultValue?: string
  name?: string
  required?: boolean
  placeholder?: string
  onChange?: (selectedId: string, technician?: Technician) => void
}

export function TechnicianSelect({
  technicians: propTechnicians,
  isLoading: propIsLoading,
  defaultValue = "",
  name = "technicianId",
  required = false,
  placeholder = "Select a technician...",
  onChange,
}: TechnicianSelectProps) {
  const { data: fetchedData, isLoading: queryLoading } = useTechniciansQuery()

  const technicians = useMemo(() => {
    if (propTechnicians) return propTechnicians
    const list = fetchedData?.technicians ?? []
    // Filter active/assignable technicians if fetching directly
    return list.filter(
      (t) => t.status !== "INACTIVE" && t.status !== "ON_LEAVE"
    )
  }, [propTechnicians, fetchedData?.technicians])

  const isLoading = propIsLoading ?? queryLoading

  const [selectedId, setSelectedId] = useState<string>(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultValue !== undefined) {
      setSelectedId(defaultValue)
    }
  }, [defaultValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const getTechName = (tech: Technician) =>
    tech.name || tech.fullName || "Technician"

  const getTechSpec = (tech: Technician) => {
    const specs = tech.specialization?.length
      ? tech.specialization
      : tech.specializations?.length
      ? tech.specializations
      : ["MAINTENANCE"]
    return specs.map((s) => s.toUpperCase()).join(", ")
  }

  const getTechDisplay = (tech: Technician) =>
    `${getTechName(tech)} - ${getTechSpec(tech)}`

  const getTechId = (tech: Technician) =>
    tech._id || tech.id || tech.userId || ""

  const filteredTechnicians = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return technicians
    return technicians.filter((tech) => {
      const name = getTechName(tech).toLowerCase()
      const specs = [
        ...(tech.specialization || []),
        ...(tech.specializations || []),
      ]
        .join(" ")
        .toLowerCase()
      const email = (tech.email || "").toLowerCase()
      return name.includes(q) || specs.includes(q) || email.includes(q)
    })
  }, [technicians, search])

  const selectedTech = useMemo(() => {
    if (!selectedId) return null
    return technicians.find((t) => {
      const id = getTechId(t)
      return (
        id === selectedId ||
        t._id === selectedId ||
        t.id === selectedId ||
        t.userId === selectedId
      )
    })
  }, [technicians, selectedId])

  const handleSelect = (tech: Technician) => {
    const id = getTechId(tech)
    setSelectedId(id)
    setIsOpen(false)
    setSearch("")
    onChange?.(id, tech)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden inputs to bind to form submission under any expected field name */}
      <input type="hidden" name={name} value={selectedId} required={required} />
      <input type="hidden" name="technician" value={selectedId} />
      <input type="hidden" name="technicianId" value={selectedId} />
      <input type="hidden" name="assignedStaff" value={selectedId} />
      <input type="hidden" name="assignedTo" value={selectedId} />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition hover:border-[#07584F] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0] disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
      >
        <span className={selectedTech ? "truncate text-[#111111]" : "text-[#8793A0]"}>
          {isLoading
            ? "Loading technicians..."
            : selectedTech
            ? getTechDisplay(selectedTech)
            : placeholder}
        </span>
        {isLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-[#8793A0]" />
        ) : (
          <ChevronDown
            className={`size-4 shrink-0 text-[#8793A0] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-[#DDE5EC] bg-white shadow-lg">
          <div className="border-b border-[#F0F2F5] p-2">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-[#8793A0]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search technician by name or skill..."
                className="h-8 w-full rounded-md border border-[#E2E8EE] bg-[#F8FAFC] pl-8 pr-3 text-[12px] text-[#111111] placeholder:text-[#8793A0] focus:border-[#07584F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1">
            {filteredTechnicians.length === 0 ? (
              <div className="py-4 text-center text-[12px] text-[#8793A0]">
                {search ? "No matching technicians found" : "No active technicians available"}
              </div>
            ) : (
              filteredTechnicians.map((tech) => {
                const id = getTechId(tech)
                const isSelected =
                  id === selectedId ||
                  tech._id === selectedId ||
                  tech.userId === selectedId
                const specs = tech.specialization?.length
                  ? tech.specialization
                  : tech.specializations?.length
                  ? tech.specializations
                  : ["MAINTENANCE"]

                return (
                  <button
                    key={id || tech._id || tech.userId}
                    type="button"
                    onClick={() => handleSelect(tech)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition ${
                      isSelected
                        ? "bg-[#EAF4F0] font-medium text-[#07584F]"
                        : "text-[#26313D] hover:bg-[#F4F7F9]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EBF2F7] text-[#5B6875]">
                        <UserRound className="size-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="truncate font-medium text-[#111111]">
                          {getTechName(tech)}
                        </div>
                        <div className="truncate text-[11px] text-[#66737F]">
                          {specs.map((s) => s.toUpperCase()).join(", ")}
                          {tech.email ? ` • ${tech.email}` : ""}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-[#07584F]" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

