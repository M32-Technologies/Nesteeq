"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangeValue {
  startDate: Date | null
  endDate: Date | null
}

interface DeliveryDateRangePickerProps {
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
  className?: string
}

export default function DeliveryDateRangePicker({
  value,
  onChange,
  className,
}: DeliveryDateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Map DateRangeValue ({ startDate, endDate }) to react-day-picker DateRange ({ from, to })
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value.startDate && !value.endDate) return undefined
    return {
      from: value.startDate || undefined,
      to: value.endDate || undefined,
    }
  }, [value.startDate, value.endDate])

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      startDate: range?.from ?? null,
      endDate: range?.to ?? null,
    })
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ startDate: null, endDate: null })
  }

  const hasValue = Boolean(value.startDate || value.endDate)

  return (
    <div className={cn("relative inline-block", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "inline-flex h-10 items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            hasValue && "border-slate-300 bg-slate-50/80 text-slate-900 font-semibold"
          )}
        >
          <CalendarIcon className="size-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            {value.startDate ? (
              value.endDate ? (
                <>
                  {format(value.startDate, "MMM dd, yyyy")} –{" "}
                  {format(value.endDate, "MMM dd, yyyy")}
                </>
              ) : (
                format(value.startDate, "MMM dd, yyyy")
              )
            ) : (
              <span className="text-slate-500 font-normal">Pick a date range</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-slate-400 transition-transform duration-150 shrink-0",
              open && "rotate-180"
            )}
          />
        </PopoverTrigger>

        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition shadow-2xs"
            title="Clear date filter"
          >
            <X className="size-2.5" />
          </button>
        )}

        <PopoverContent
          className="w-auto p-0 border border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden"
          align="end"
          side="bottom"
          sideOffset={6}
        >
          <div className="p-1">
            <Calendar
              mode="range"
              defaultMonth={value.startDate || new Date()}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
