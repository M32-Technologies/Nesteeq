"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, LogOut, Settings, Menu, Shield, Home } from "lucide-react"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type AdminNavbarProps = {
  onMenuClick?: () => void
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const userName = user?.name || user?.email?.split("@")[0] || ""
  const userEmail = user?.email || ""
  const userInitial = userName ? userName.charAt(0).toUpperCase() : ""
  const userAvatar = user?.image || null

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      toast.success("Signed out successfully.")
      router.push("/admin/login")
      router.refresh()
    } catch {
      toast.error("Failed to sign out. Please try again.")
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-[60px] w-full items-center justify-between px-6 sm:px-8 bg-[#F8FAF8]">
      {/* 1. LEFT: Fully Rounded Pill Search Bar (+ Mobile menu button) */}
      <div className="flex items-center gap-2.5 flex-1 max-w-[400px]">
        {/* Mobile menu toggle button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#475569] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 hover:text-[#0F172A] lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Fully Pill-Shaped Container — stays 100% round on click/focus */}
        <div className="relative flex items-center w-full rounded-full border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#07584F] focus-within:ring-2 focus-within:ring-[#07584F]/15">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="h-[38px] w-full rounded-full border-0 bg-transparent pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* 2. CENTER: Large Empty Whitespace */}
      <div className="flex-1" />

      {/* 3. RIGHT: Go to Home + Notification Bell + Super Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Go to Home Screen Button */}
        <Link
          href="/"
          title="Go to Home Screen"
          className="flex items-center gap-1.5 h-[38px] px-3 sm:px-3.5 rounded-full border border-[#E5E7EB] bg-white text-[12.5px] font-medium text-[#475569] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 hover:text-[#07584F] hover:border-[#07584F]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07584F]"
        >
          <Home className="h-3.5 w-3.5 text-[#07584F]" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {/* Notification Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 hover:text-[#0F172A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07584F]"
        >
          <Bell className="h-4 w-4 text-[#334155]" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </button>

        {/* Super Admin Profile Area */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-label="Admin profile menu"
            className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1.5 transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07584F]"
          >
            {/* Avatar with Smooth Shimmer Pulse on Refresh - NO "SA" FLASH */}
            <span className="relative inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#07584F] text-xs font-semibold text-white shadow-2xs">
              {isPending ? (
                <span className="h-full w-full animate-pulse bg-slate-200" />
              ) : userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName || "Super Admin"}
                  width={34}
                  height={34}
                  className="h-full w-full object-cover"
                />
              ) : userInitial ? (
                <span>{userInitial}</span>
              ) : (
                <Shield className="h-3.5 w-3.5 text-white" />
              )}
            </span>

            {/* Display: Super Admin (with skeleton during load) */}
            {isPending ? (
              <span className="hidden sm:inline-block h-3.5 w-18 bg-slate-200/80 rounded animate-pulse" />
            ) : (
              <span className="hidden sm:inline-block text-[13px] font-semibold text-[#0F172A] tracking-tight">
                Super Admin
              </span>
            )}

            {/* Downward Chevron */}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#334155] transition-transform duration-200",
                isProfileOpen && "rotate-180"
              )}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[#E2E8F0] bg-white p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-[#F1F5F9] px-3 py-2.5">
                <p className="text-xs font-semibold text-[#0F172A]">
                  {userName || "Super Admin"}
                </p>
                {userEmail && (
                  <p className="truncate text-[11px] text-[#64748B]">{userEmail}</p>
                )}
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#0F766E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </span>
              </div>

              <div className="py-1">
                {/* Link to Home Screen */}
                <Link
                  href="/"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 hover:text-[#0F172A]"
                >
                  <Home className="h-4 w-4 text-[#64748B]" />
                  <span>Go to Home Screen</span>
                </Link>

                {/* Link to Settings */}
                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 hover:text-[#0F172A]"
                >
                  <Settings className="h-4 w-4 text-[#64748B]" />
                  <span>Portal Settings</span>
                </Link>
              </div>

              <div className="border-t border-[#F1F5F9] pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
