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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] w-full items-center justify-between px-6 sm:px-8 py-3 bg-[#F1F3F6]/95 backdrop-blur-xs">
      {/* 1. LEFT: Greeting & Subtitle (+ Mobile menu button) */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-[#475569] shadow-2xs transition-colors hover:bg-slate-50 hover:text-[#0F172A] lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1
            suppressHydrationWarning
            className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] truncate"
          >
            {getGreeting()}, {userName}
          </h1>
          <p className="text-xs text-[#64748B] truncate hidden sm:block">
            Here&apos;s what&apos;s happening across your platform today.
          </p>
        </div>
      </div>

      {/* 2. RIGHT: Normal Search Bar + Notification Bell + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-4">
        {/* Normal Search Bar (Requested by user: "the serch bar normal type ok") */}
        <div className="relative hidden md:flex items-center w-[200px] lg:w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="h-10 w-full rounded-2xl border border-slate-200/80 bg-white pl-9 pr-3.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] shadow-2xs outline-none focus:border-[#07584F] focus:ring-1 focus:ring-[#07584F] transition-all"
          />
        </div>

        {/* Go to Home Screen Button */}
        <Link
          href="/"
          title="Go to Public Home"
          className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-2xl border border-slate-200/80 bg-white text-xs font-semibold text-[#475569] shadow-2xs transition-colors hover:bg-slate-50 hover:text-[#07584F] hover:border-[#07584F]/30"
        >
          <Home className="h-3.5 w-3.5 text-[#07584F]" />
          <span>Home</span>
        </Link>

        {/* Notification Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-[#334155] shadow-2xs transition-colors hover:bg-slate-50 hover:text-[#0F172A] cursor-pointer"
        >
          <Bell className="h-4 w-4 text-[#334155]" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </button>

        {/* Super Admin Profile Area */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-label="Admin profile menu"
            className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white py-1 pl-1 pr-2.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            {/* Avatar */}
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#07584F] text-xs font-semibold text-white">
              {isPending ? (
                <span className="h-full w-full animate-pulse bg-slate-200" />
              ) : userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName || "Super Admin"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : userInitial ? (
                <span>{userInitial}</span>
              ) : (
                <Shield className="h-3.5 w-3.5 text-white" />
              )}
            </span>

            {/* Display name */}
            <span className="hidden sm:inline-block text-xs font-semibold text-[#0F172A] tracking-tight">
              Super Admin
            </span>

            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#64748B] transition-transform duration-200",
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
