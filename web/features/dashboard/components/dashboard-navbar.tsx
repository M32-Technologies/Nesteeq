"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Menu, Settings, ShieldAlert, UserRound } from "lucide-react"
import { NotificationDropdown } from "@/features/notifications"

import { signOut } from "@/lib/auth-client"
import {
  dashboardRoleLabels,
  getDashboardItemHref,
  getDashboardRoleRouteSegment,
  sidebarNavigation,
  type DashboardRole,
} from "@/features/dashboard/config/sidebar-navigation"

type DashboardNavbarProps = {
  role: DashboardRole
  isSidebarOpen: boolean
  onOpenSidebar: () => void
  user: {
    name: string
    email: string
    image?: string | null
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getBreadcrumb(role: DashboardRole, pathname: string) {
  const roleHomePath = `/${getDashboardRoleRouteSegment(role)}`

  for (const section of sidebarNavigation[role]) {
    for (const item of section.items) {
      const href = getDashboardItemHref(role, item.href)
      const isActive =
        pathname === href ||
        (href !== roleHomePath && pathname.startsWith(`${href}/`))

      if (isActive) {
        return {
          parent: section.title,
          current: item.title,
        }
      }
    }
  }

  if (pathname === "/profile" || pathname.endsWith("/profile")) {
    return {
      parent: dashboardRoleLabels[role],
      current: "My Profile",
    }
  }

  return {
    parent: dashboardRoleLabels[role],
    current: "Dashboard",
  }
}

export default function DashboardNavbar({
  role,
  isSidebarOpen,
  onOpenSidebar,
  user,
}: DashboardNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumb = getBreadcrumb(role, pathname)
  const initials = getInitials(user.name)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileOpen])

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-[60px]
        items-center
        justify-between
        gap-3
        border-b
        border-[#E2E8F0]
        bg-white/95
        px-4
        backdrop-blur-md
        sm:px-6
      "
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      {/* LEFT — hamburger + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={isSidebarOpen}
          onClick={onOpenSidebar}
          className="
            flex
            size-9
            cursor-pointer
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-[#475569]
            transition-colors
            duration-150
            hover:bg-[#F1F5F9]
            hover:text-[#0F172A]
            lg:hidden
          "
        >
          <Menu className="size-[18px]" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2"
        >
          <span className="truncate text-[13px] font-semibold text-[#94A3B8]">
            {breadcrumb.parent}
          </span>
          <span className="text-[#CBD5E1] text-[13px]">/</span>
          <span className="truncate text-[14px] font-semibold text-[#0F172A]">
            {breadcrumb.current}
          </span>
        </nav>
      </div>

      {/* RIGHT — notifications + profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

        {/* Resident Emergency SOS Button */}
        {role === "resident" && (
          <Link
            href="/resident/alerts"
            aria-label="Emergency SOS Alert"
            className="
              inline-flex
              h-9
              items-center
              gap-1.5
              rounded-xl
              bg-red-600
              px-2.5
              text-xs
              font-bold
              text-white
              shadow-xs
              transition-all
              hover:bg-red-700
              active:scale-95
              sm:px-3
            "
          >
            <ShieldAlert className="size-4 animate-pulse text-white" />
            <span className="hidden sm:inline tracking-wide">Emergency SOS</span>
            <span className="sm:hidden">SOS</span>
          </Link>
        )}

        {/* Notification bell */}
        <NotificationDropdown />

        {/* Divider */}
        <div className="hidden h-7 w-px bg-[#E2E8F0] sm:block" />

        {/* Profile button & dropdown */}
        <div ref={profileDropdownRef} className="relative">
          <button
            type="button"
            aria-label="User Profile Menu"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="
              flex
              h-10
              cursor-pointer
              items-center
              gap-2.5
              rounded-lg
              px-2
              text-left
              transition-colors
              duration-150
              hover:bg-[#F1F5F9]
            "
          >
            {/* Avatar */}
            <span
              className="
                flex
                size-8
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#0F766E]
                text-[11px]
                font-bold
                tracking-wide
                text-white
                ring-2
                ring-white
              "
              style={{ boxShadow: '0 0 0 2px #E2E8F0' }}
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : initials ? (
                initials
              ) : (
                <UserRound className="size-4" />
              )}
            </span>

            {/* Name + role — hidden on small screens */}
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-32 truncate text-[13px] font-semibold leading-[1.3] text-[#0F172A]">
                {user.name}
              </span>
              <span className="block max-w-32 truncate text-[11px] font-medium leading-[1.3] text-[#94A3B8]">
                {dashboardRoleLabels[role]}
              </span>
            </span>
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#DDE3DF] bg-white p-2 shadow-lg z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-[#EEF1F4] mb-1">
                <p className="text-xs font-semibold text-[#111111] truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-[#637083] truncate">
                  {user.email}
                </p>
                <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">
                  {dashboardRoleLabels[role]}
                </p>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors"
              >
                <Settings className="size-3.5 text-[#637083]" />
                <span>Account Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false)
                  void handleSignOut()
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

