"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, Menu, UserRound } from "lucide-react"

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
  const breadcrumb = getBreadcrumb(role, pathname)
  const initials = getInitials(user.name)

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

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="
            relative
            flex
            size-9
            cursor-pointer
            items-center
            justify-center
            rounded-lg
            text-[#475569]
            transition-colors
            duration-150
            hover:bg-[#F1F5F9]
            hover:text-[#0F172A]
          "
        >
          <Bell className="size-[18px]" />
          {/* notification dot */}
          <span
            className="absolute right-[9px] top-[9px] size-[7px] rounded-full bg-red-500 ring-[1.5px] ring-white"
            aria-hidden="true"
          />
        </button>

        {/* Divider */}
        <div className="hidden h-7 w-px bg-[#E2E8F0] sm:block" />

        {/* Profile button */}
        <button
          type="button"
          aria-label="Profile menu"
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
      </div>
    </header>
  )
}

