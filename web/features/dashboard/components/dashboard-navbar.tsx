"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, Menu, UserRound } from "lucide-react"

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
        h-16
        items-center
        justify-between
        gap-3
        border-b
        border-[#E4EAF0]
        bg-white
        px-4
        backdrop-blur
        sm:px-5
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={isSidebarOpen}
          onClick={onOpenSidebar}
          className="
            flex
            size-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-[#071D35]
            transition-colors
            hover:bg-[#F0F5FA]
            lg:hidden
          "
        >
          <Menu className="size-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="
            flex
            min-w-0
            items-center
            gap-2.5
            text-[15px]
            text-[#101B2A]
          "
        >
          <span className="truncate font-bold">{breadcrumb.parent}</span>
          <span className="text-[#A2ADBA]">/</span>
          <span className="truncate font-semibold text-[#667386]">
            {breadcrumb.current}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="
            relative
            flex
            size-10
            items-center
            justify-center
            rounded-lg
            text-[#1E2B3C]
            transition-colors
            hover:bg-[#F0F5FA]
          "
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-[#E5EAF0] sm:block" />

        <button
          type="button"
          aria-label="Profile"
          className="
            flex
            h-11
            min-w-0
            items-center
            gap-2
            rounded-lg
            px-1.5
            text-left
            transition-colors
            hover:bg-[#F0F5FA]
            sm:pr-2
          "
        >
          <span
            className="
              flex
              size-10
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-full
              bg-[#0D3768]
              text-xs
              font-semibold
              text-white
            "
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={40}
                height={40}
                unoptimized
                className="size-full object-cover"
              />
            ) : initials ? (
              initials
            ) : (
              <UserRound className="size-[18px]" />
            )}
          </span>

          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-36 truncate text-[13px] font-bold leading-4 text-[#101B2A]">
              {user.name}
            </span>
            <span className="block max-w-36 truncate text-[11px] font-semibold leading-4 text-[#667386]">
              {dashboardRoleLabels[role]}
            </span>
          </span>

          <ChevronDown className="hidden size-4 shrink-0 text-[#667386] sm:block" />
        </button>
      </div>
    </header>
  )
}
