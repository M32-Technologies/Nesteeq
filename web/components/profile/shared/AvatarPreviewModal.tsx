"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Loader2, X } from "lucide-react"

export interface AvatarPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  avatarUrl?: string | null
  subtitle?: string
  onUploadClick?: () => void
  isLoading?: boolean
}

export function AvatarPreviewModal({
  isOpen,
  onClose,
  name,
  avatarUrl,
  subtitle,
  onUploadClick,
  isLoading = false,
}: AvatarPreviewModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted || !avatarUrl) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full"
            role="dialog"
            aria-modal="true"
            aria-label={`${name}'s Profile Photo`}
          >
            {/* Top Bar with Title and Close button */}
            <div className="flex items-center justify-between w-full mb-3 px-1 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                  Profile Photo
                </span>
                {subtitle && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-300 border border-white/10">
                    {subtitle}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close photo preview"
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="size-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Main Avatar Image */}
            <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-slate-950">
              <Image
                src={avatarUrl}
                alt={name || "User Profile Photo"}
                fill
                sizes="(max-width: 640px) 340px, 400px"
                unoptimized
                priority
                className="object-cover size-full select-none"
              />
            </div>

            {/* Footer with Info & Action Buttons */}
            <div className="mt-4 flex flex-col items-center gap-3 w-full">
              <h3 className="text-white text-base sm:text-lg font-bold tracking-tight text-center">
                {name}
              </h3>

              {onUploadClick && (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onUploadClick()
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#08281E] text-xs sm:text-sm font-semibold hover:bg-slate-100 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Camera className="size-3.5 stroke-[2.2]" />
                    )}
                    <span>Change Photo</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
