"use client"

import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"
import { MoreVertical } from "lucide-react"

import { cn } from "@/features/dashboard/facility/shared/components/facility-formatters"

export interface TableActionItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "purple" | "destructive"
  disabled?: boolean
  dividerAbove?: boolean
}

export interface TableActionMenuProps {
  items: TableActionItem[]
  label?: string
  align?: "left" | "right"
}

export function TableActionMenu({
  items,
  label = "Row actions",
  align = "right",
}: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 190
    const estimatedHeight = items.length * 38 + 16

    // Open upwards if not enough space below
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpwards = spaceBelow < estimatedHeight && rect.top > estimatedHeight

    const top = openUpwards ? rect.top - estimatedHeight - 4 : rect.bottom + 4
    const left =
      align === "right"
        ? Math.max(8, rect.right - menuWidth)
        : Math.min(window.innerWidth - menuWidth - 8, rect.left)

    setCoords({ top, left })
  }

  const handleToggle = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isOpen) {
      updatePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleCloseEvents = () => setIsOpen(false)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    window.addEventListener("scroll", handleCloseEvents, true)
    window.addEventListener("resize", handleCloseEvents)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      window.removeEventListener("scroll", handleCloseEvents, true)
      window.removeEventListener("resize", handleCloseEvents)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#07584F]/20",
          isOpen && "bg-slate-100 text-slate-900"
        )}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="size-4" />
      </button>

      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[9999] w-[190px] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] animate-in fade-in-0 zoom-in-95 duration-100"
            role="menu"
          >
            {items.map((item, index) => {
              const isPurple = item.variant === "purple"
              const isDestructive = item.variant === "destructive"

              return (
                <div key={index}>
                  {item.dividerAbove && (
                    <div className="my-1 h-px bg-slate-100" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setIsOpen(false)
                      item.onClick()
                    }}
                    disabled={item.disabled}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                      isPurple && "text-[#5542F6] hover:bg-[#F5F3FF]",
                      isDestructive && "text-red-600 hover:bg-red-50",
                      !isPurple &&
                        !isDestructive &&
                        "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    role="menuitem"
                  >
                    {item.icon && (
                      <span
                        className={cn(
                          "shrink-0 transition",
                          isPurple && "text-[#5542F6]",
                          isDestructive && "text-red-600",
                          !isPurple &&
                            !isDestructive &&
                            "text-slate-400 group-hover:text-slate-700"
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                </div>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
