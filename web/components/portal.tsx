"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

type PortalProps = {
  children: ReactNode
}

export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(children, document.body)
}
