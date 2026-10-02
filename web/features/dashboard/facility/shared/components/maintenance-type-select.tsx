"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Check,
  ChevronDown,
  Droplets,
  Hammer,
  Layers,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Wind,
  Wrench,
  Zap,
} from "lucide-react"

import { useMaintenanceTypesQuery } from "@/features/dashboard/facility/maintenance/hooks/use-maintenance-queries"
import type { MaintenanceTaskTemplate } from "@/features/dashboard/facility/maintenance/types/maintenance.types"

export const DEFAULT_MAINTENANCE_TEMPLATES: MaintenanceTaskTemplate[] = [
  {
    id: "ELECTRICAL_REPAIR",
    title: "Electrical Repair",
    category: "ELECTRICAL",
    description: "Wiring, switchboard, fuse, circuit breaker, or lighting repairs",
  },
  {
    id: "PLUMBING_WORK",
    title: "Plumbing Work",
    category: "PLUMBING",
    description: "Pipe leakage, faucet repair, drain blockage, or sanitary fittings",
  },
  {
    id: "HVAC_MAINTENANCE",
    title: "HVAC Maintenance",
    category: "MAINTENANCE",
    description: "Air conditioning, cooling systems, ventilation, and filter servicing",
  },
  {
    id: "CARPENTRY_WORK",
    title: "Carpentry & Woodwork",
    category: "MAINTENANCE",
    description: "Door, window, lock, cabinet, furniture, or wooden fixture repairs",
  },
  {
    id: "GENERAL_SERVICING",
    title: "General Servicing",
    category: "MAINTENANCE",
    description: "Periodic facility servicing, preventive maintenance, and handyman tasks",
  },
  {
    id: "CLEANING_SANITIZATION",
    title: "Cleaning & Sanitization",
    category: "CLEANING",
    description: "Deep cleaning, corridor sanitization, common area upkeep, and waste disposal",
  },
  {
    id: "SECURITY_CHECK",
    title: "Security System Check",
    category: "SECURITY",
    description: "CCTV, intercom, access control gates, and sensor maintenance",
  },
  {
    id: "LIFT_SERVICING",
    title: "Elevator / Lift Servicing",
    category: "MAINTENANCE",
    description: "Routine lift inspection, motor diagnostics, and door sensor maintenance",
  },
]

function getCategoryIcon(category: string) {
  const cat = (category || "").toUpperCase()
  if (cat.includes("ELEC")) return Zap
  if (cat.includes("PLUMB")) return Droplets
  if (cat.includes("HVAC") || cat.includes("AIR")) return Wind
  if (cat.includes("CARP")) return Hammer
  if (cat.includes("CLEAN")) return Sparkles
  if (cat.includes("SEC")) return ShieldCheck
  if (cat.includes("MAINT")) return Wrench
  return Layers
}

export interface MaintenanceTypeSelectProps {
  types?: MaintenanceTaskTemplate[]
  isLoading?: boolean
  defaultValue?: string
  defaultCategory?: string
  name?: string
  required?: boolean
  placeholder?: string
  onChange?: (selectedId: string, template?: MaintenanceTaskTemplate) => void
}

export function MaintenanceTypeSelect({
  types: propTypes,
  isLoading: propIsLoading,
  defaultValue = "",
  defaultCategory,
  name = "maintenanceType",
  required = false,
  placeholder = "Select maintenance type / task...",
  onChange,
}: MaintenanceTypeSelectProps) {
  const { data: fetchedData, isLoading: queryLoading } = useMaintenanceTypesQuery()

  const availableTypes: MaintenanceTaskTemplate[] = useMemo(() => {
    if (propTypes && propTypes.length > 0) return propTypes
    if (fetchedData && fetchedData.length > 0) return fetchedData
    return DEFAULT_MAINTENANCE_TEMPLATES
  }, [propTypes, fetchedData])

  const isLoading = propIsLoading ?? queryLoading

  const initialSelectedId = useMemo(() => {
    if (defaultValue) return defaultValue
    if (defaultCategory) {
      const match = availableTypes.find(
        (t: MaintenanceTaskTemplate) =>
          t.category?.toUpperCase() === defaultCategory.toUpperCase()
      )
      if (match) return match.id
    }
    return ""
  }, [defaultValue, defaultCategory, availableTypes])

  const [selectedId, setSelectedId] = useState<string>(initialSelectedId)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultValue) {
      setSelectedId(defaultValue)
    } else if (defaultCategory && !selectedId) {
      const match = availableTypes.find(
        (t: MaintenanceTaskTemplate) =>
          t.category?.toUpperCase() === defaultCategory.toUpperCase()
      )
      if (match) {
        setSelectedId(match.id)
      }
    }
  }, [defaultValue, defaultCategory, availableTypes, selectedId])

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

  const selectedItem: MaintenanceTaskTemplate | null = useMemo(() => {
    if (!selectedId) return null
    return (
      availableTypes.find(
        (t: MaintenanceTaskTemplate) =>
          t.id === selectedId ||
          t.category?.toUpperCase() === selectedId.toUpperCase()
      ) || null
    )
  }, [availableTypes, selectedId])

  const filteredTypes: MaintenanceTaskTemplate[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableTypes
    return availableTypes.filter((item: MaintenanceTaskTemplate) => {
      const title = (item.title || "").toLowerCase()
      const category = (item.category || "").toLowerCase()
      const desc = (item.description || "").toLowerCase()
      const combined = `${title} (${category})`
      return combined.includes(q) || desc.includes(q)
    })
  }, [availableTypes, search])

  const handleSelect = (item: MaintenanceTaskTemplate) => {
    setSelectedId(item.id)
    setIsOpen(false)
    setSearch("")
    onChange?.(item.id, item)
  }

  const getDisplayLabel = (item: MaintenanceTaskTemplate) =>
    `${item.title} (${item.category.toUpperCase()})`

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden inputs to bind to HTML form submission */}
      <input type="hidden" name={name} value={selectedId} required={required} />
      <input type="hidden" name="maintenanceTypeId" value={selectedId} />
      <input type="hidden" name="category" value={selectedItem?.category || ""} />
      <input type="hidden" name="maintenanceTitle" value={selectedItem?.title || ""} />
      <input type="hidden" name="title" value={selectedItem?.title || ""} />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition hover:border-[#07584F] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0] disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
      >
        <span className={selectedItem ? "truncate text-[#111111]" : "text-[#8793A0]"}>
          {isLoading
            ? "Loading maintenance tasks..."
            : selectedItem
            ? getDisplayLabel(selectedItem)
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
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-[#DDE5EC] bg-white shadow-lg">
          <div className="border-b border-[#F0F2F5] p-2">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-[#8793A0]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search maintenance task or category..."
                className="h-8 w-full rounded-md border border-[#E2E8EE] bg-[#F8FAFC] pl-8 pr-3 text-[12px] text-[#111111] placeholder:text-[#8793A0] focus:border-[#07584F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {filteredTypes.length === 0 ? (
              <div className="py-4 text-center text-[12px] text-[#8793A0]">
                {search ? "No matching maintenance types found" : "No maintenance types available"}
              </div>
            ) : (
              filteredTypes.map((item: MaintenanceTaskTemplate) => {
                const isSelected =
                  item.id === selectedId ||
                  item.category?.toUpperCase() === selectedId.toUpperCase()
                const Icon = getCategoryIcon(item.category)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition ${
                      isSelected
                        ? "bg-[#EAF4F0] font-medium text-[#07584F]"
                        : "text-[#26313D] hover:bg-[#F4F7F9]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                          isSelected
                            ? "bg-[#07584F] text-white"
                            : "bg-[#EBF2F7] text-[#5B6875]"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="truncate font-medium text-[#111111]">
                          {getDisplayLabel(item)}
                        </div>
                        {item.description ? (
                          <div className="truncate text-[11px] text-[#66737F]">
                            {item.description}
                          </div>
                        ) : null}
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
