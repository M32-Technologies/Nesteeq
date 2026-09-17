"use client"

import { useState } from "react"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react"
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns"
import { Portal } from "@/components/portal"

export interface DateRangeValue {
  startDate: Date | null
  endDate: Date | null
}

interface DeliveryDateRangePickerProps {
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
}

type PresetKey =
  | "all"
  | "today"
  | "yesterday"
  | "thisWeek"
  | "last7Days"
  | "last14Days"
  | "thisMonth"
  | "lastMonth"

interface PresetOption {
  key: PresetKey
  label: string
  getRange: () => DateRangeValue
}

const presets: PresetOption[] = [
  {
    key: "all",
    label: "All Dates",
    getRange: () => ({ startDate: null, endDate: null }),
  },
  {
    key: "today",
    label: "Today",
    getRange: () => {
      const now = new Date()
      return { startDate: now, endDate: now }
    },
  },
  {
    key: "yesterday",
    label: "Yesterday",
    getRange: () => {
      const y = subDays(new Date(), 1)
      return { startDate: y, endDate: y }
    },
  },
  {
    key: "thisWeek",
    label: "This Week",
    getRange: () => {
      const now = new Date()
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      }
    },
  },
  {
    key: "last7Days",
    label: "Last 7 Days",
    getRange: () => {
      const now = new Date()
      return { startDate: subDays(now, 6), endDate: now }
    },
  },
  {
    key: "last14Days",
    label: "Last 14 Days",
    getRange: () => {
      const now = new Date()
      return { startDate: subDays(now, 13), endDate: now }
    },
  },
  {
    key: "thisMonth",
    label: "This Month",
    getRange: () => {
      const now = new Date()
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    },
  },
  {
    key: "lastMonth",
    label: "Last Month",
    getRange: () => {
      const prev = subMonths(new Date(), 1)
      return { startDate: startOfMonth(prev), endDate: endOfMonth(prev) }
    },
  },
]

export default function DeliveryDateRangePicker({
  value,
  onChange,
}: DeliveryDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRangeValue>(value)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value.startDate || new Date()
  )
  const [activePreset, setActivePreset] = useState<PresetKey | null>(
    !value.startDate && !value.endDate ? "all" : null
  )

  const handleOpen = () => {
    setTempRange(value)
    setCurrentMonth(value.startDate || new Date())
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleApply = () => {
    onChange(tempRange)
    setIsOpen(false)
  }

  const handleClear = () => {
    const empty = { startDate: null, endDate: null }
    setTempRange(empty)
    setActivePreset("all")
    onChange(empty)
    setIsOpen(false)
  }

  const handlePresetSelect = (preset: PresetOption) => {
    setActivePreset(preset.key)
    const newRange = preset.getRange()
    setTempRange(newRange)
    if (newRange.startDate) {
      setCurrentMonth(newRange.startDate)
    }
  }

  const handleDayClick = (day: Date) => {
    setActivePreset(null)
    const { startDate, endDate } = tempRange

    if (!startDate || (startDate && endDate)) {
      // Start a new range selection
      setTempRange({ startDate: day, endDate: null })
    } else if (startDate && !endDate) {
      if (isBefore(day, startDate)) {
        setTempRange({ startDate: day, endDate: startDate })
      } else {
        setTempRange({ startDate, endDate: day })
      }
    }
  }

  // Generate calendar days for current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = new Date(day.getTime() + 24 * 60 * 60 * 1000)
  }

  const isDaySelected = (d: Date) => {
    if (!tempRange.startDate) return false
    if (isSameDay(d, tempRange.startDate)) return true
    if (tempRange.endDate && isSameDay(d, tempRange.endDate)) return true
    return false
  }

  const isDayInRange = (d: Date) => {
    if (!tempRange.startDate || !tempRange.endDate) return false
    return isAfter(d, tempRange.startDate) && isBefore(d, tempRange.endDate)
  }

  const formattedLabel = (() => {
    if (value.startDate && value.endDate) {
      return `${format(value.startDate, "MMM dd, yyyy")} – ${format(
        value.endDate,
        "MMM dd, yyyy"
      )}`
    }
    if (value.startDate) {
      return `From ${format(value.startDate, "MMM dd, yyyy")}`
    }
    return "Filter by Date"
  })()

  const hasActiveFilter = Boolean(value.startDate || value.endDate)

  return (
    <>
      {/* Trigger Button */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
            hasActiveFilter
              ? "border-[#0F5F45] bg-[#0F5F45]/5 text-[#0F5F45] ring-2 ring-[#0F5F45]/15"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <CalendarIcon
            size={14}
            className={hasActiveFilter ? "text-[#0F5F45]" : "text-slate-500"}
          />
          <span>{formattedLabel}</span>
          <ChevronDown
            size={14}
            className={hasActiveFilter ? "text-[#0F5F45]" : "text-slate-400"}
          />
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            title="Clear date filter"
            className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Date Filter Modal */}
      {isOpen && (
        <Portal>
          <div
            style={{ zIndex: 1000 }}
            className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={handleClose}
          >
            <div
              className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Filter Deliveries by Date
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Select a preset or custom date range to filter incoming parcels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Left Presets, Right Calendar */}
              <div className="flex flex-col sm:flex-row">
                {/* Left Presets Column */}
                <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/50 p-3 space-y-1">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Presets
                  </p>
                  {presets.map((preset) => {
                    const isSelected = activePreset === preset.key
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#0F5F45] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Right Calendar Column */}
                <div className="flex-1 p-5">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between pb-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      {format(currentMonth, "MMMM yyyy")}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 pb-2">
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                    <span>Su</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                    {days.map((d, index) => {
                      const isCurrentMonth = isSameMonth(d, currentMonth)
                      const isSelected = isDaySelected(d)
                      const inRange = isDayInRange(d)

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-center py-1 ${
                            inRange ? "bg-[#0F5F45]/10" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleDayClick(d)}
                            className={`flex size-8 items-center justify-center rounded-lg font-medium transition ${
                              isSelected
                                ? "bg-[#0F5F45] font-bold text-white shadow-xs"
                                : !isCurrentMonth
                                ? "text-slate-300 hover:bg-slate-100"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {format(d, "d")}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Range preview notice */}
                  <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-center text-xs text-slate-600 border border-slate-100">
                    {tempRange.startDate && tempRange.endDate ? (
                      <span className="font-semibold text-[#0F5F45]">
                        {format(tempRange.startDate, "MMM dd, yyyy")} –{" "}
                        {format(tempRange.endDate, "MMM dd, yyyy")}
                      </span>
                    ) : tempRange.startDate ? (
                      <span>
                        Start:{" "}
                        <strong className="text-slate-900">
                          {format(tempRange.startDate, "MMM dd, yyyy")}
                        </strong>{" "}
                        (click another date for end date)
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        No range selected. Choose a preset or click two dates.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
                >
                  <RotateCcw size={13} />
                  Reset to All Dates
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-lg bg-[#0F5F45] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0c4e38] transition"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
