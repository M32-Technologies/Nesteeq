"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  CSSProperties,
  ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { MoreVertical } from "lucide-react"

export type SecurityMenuAction = {
  label: string
  icon: ReactNode
  tone?: "default" | "danger"
  disabled?: boolean
  onClick: () => void
}

const MENU_WIDTH = 192
const MENU_EDGE_GAP = 8
const MENU_OFFSET = 4
const MENU_ITEM_HEIGHT = 36
const MENU_PADDING = 8

export function SecurityActionsMenu({
  actions,
  label,
}: {
  actions: SecurityMenuAction[]
  label: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] =
    useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) return

    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const closeMenu = () => {
    clearCloseTimer()
    setMenuOpen(false)
  }

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()

    if (!rect) return

    const menuHeight =
      actions.length * MENU_ITEM_HEIGHT + MENU_PADDING
    const opensUp =
      rect.bottom + MENU_OFFSET + menuHeight >
      window.innerHeight - MENU_EDGE_GAP
    const top = opensUp
      ? Math.max(
          MENU_EDGE_GAP,
          rect.top - menuHeight - MENU_OFFSET
        )
      : rect.bottom + MENU_OFFSET
    const left = Math.max(
      MENU_EDGE_GAP,
      Math.min(
        rect.right - MENU_WIDTH,
        window.innerWidth - MENU_WIDTH - MENU_EDGE_GAP
      )
    )

    setMenuStyle({
      left,
      top,
      width: MENU_WIDTH,
    })
  }

  const openMenu = () => {
    clearCloseTimer()
    updateMenuPosition()
    setMenuOpen(true)
  }

  const closeMenuSoon = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setMenuOpen(false)
      closeTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const closeCurrentMenu = () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }

      setMenuOpen(false)
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }

      closeCurrentMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCurrentMenu()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      )
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        title="Actions"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE3DF] bg-white text-[#637083] transition hover:bg-[#F7F8F5] hover:text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#07584F]/20"
        onClick={openMenu}
        onFocus={openMenu}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenuSoon}
      >
        <MoreVertical size={18} />
      </button>

      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="fixed z-[100] rounded-lg border border-[#DDE3DF] bg-white p-1 text-left shadow-lg"
              onMouseEnter={openMenu}
              onMouseLeave={closeMenuSoon}
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  className={menuActionClassName(
                    action.tone,
                    action.disabled
                  )}
                  onClick={() => {
                    action.onClick()
                    closeMenu()
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

function menuActionClassName(
  tone?: "default" | "danger",
  disabled?: boolean
) {
  const color =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-[#111111] hover:bg-[#F7F8F5]"
  const state = disabled
    ? "cursor-not-allowed opacity-50"
    : ""

  return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${color} ${state}`
}
