"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
} from "lucide-react"

import { signOut } from "@/lib/auth-client"

import {
  dashboardRoleLabels,
  sidebarNavigation,
  type DashboardRole,
} from "../config/sidebar-navigation"

type DashboardSidebarProps = {
  role: DashboardRole

  user: {
    name: string
    email: string
    image?: string | null
  }
}

export default function DashboardSidebar({
  role,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navigation = sidebarNavigation[role]
  const roleLabel = dashboardRoleLabels[role]

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <aside
      className="
        group/sidebar

        fixed
        left-0
        top-0
        z-50

        hidden
        h-screen
        w-[76px]
        flex-col

        overflow-hidden

        bg-[#071D35]

        transition-[width]
        duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:w-[264px]

        lg:flex
      "
    >
      {/* =========================
          LOGO
      ========================== */}

      <div className="flex h-[76px] shrink-0 items-center">
        <div className="flex w-[76px] shrink-0 items-center justify-center">
          <div
            className="
              flex
              size-10
              items-center
              justify-center

              rounded-xl

              bg-white/10
              ring-1
              ring-white/10
            "
          >
            <span className="text-lg font-bold text-white">
              N
            </span>
          </div>
        </div>

        <div
          className="
            w-[172px]
            min-w-0

            -translate-x-1
            opacity-0

            transition-all
            duration-200

            group-hover/sidebar:translate-x-0
            group-hover/sidebar:opacity-100
          "
        >
          <p
            className="
              truncate
              whitespace-nowrap

              text-[20px]
              font-semibold
              tracking-[-0.5px]

              text-white
            "
          >
            Nesteeq
          </p>

          <p
            className="
              truncate
              whitespace-nowrap

              text-[11px]
              font-medium

              text-[#8BA2BB]
            "
          >
            {roleLabel} Dashboard
          </p>
        </div>
      </div>
      {/* =========================
          NAVIGATION
      ========================== */}

      <nav
        className="
          mt-5
          flex-1

          overflow-x-hidden
          overflow-y-auto

          px-[10px]

          [&::-webkit-scrollbar]:hidden
        "
      >
        <div className="space-y-5">
          {navigation.map((section, sectionIndex) => (
            <div key={`${section.title}-${sectionIndex}`}>
              {/* SECTION TITLE */}

              <div
                className="
                  mb-2
                  ml-[15px]

                  h-[16px]

                  whitespace-nowrap

                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.12em]

                  text-[#63768D]

                  opacity-0

                  transition-opacity
                  duration-150

                  group-hover/sidebar:opacity-100
                "
              >
                {section.title}
              </div>

              {/* ITEMS */}

              <div className="space-y-[4px]">
                {section.items.map((item) => {
                  const Icon = item.icon

                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      className={`
                        relative

                        flex
                        h-[46px]
                        w-full
                        items-center

                        overflow-hidden

                        rounded-xl

                        transition-all
                        duration-200

                        ${
                          isActive
                            ? "bg-[#16477C] text-white"
                            : "text-[#97A9BD] hover:bg-white/[0.07] hover:text-white"
                        }
                      `}
                    >
                      {/* ACTIVE INDICATOR */}

                      {isActive && (
                        <span
                          className="
                            absolute
                            left-0
                            top-1/2

                            h-6
                            w-[3px]

                            -translate-y-1/2

                            rounded-r-full

                            bg-[#3D91FF]
                          "
                        />
                      )}

                      {/* ICON */}

                      <div
                        className="
                          flex
                          w-[56px]
                          shrink-0
                          items-center
                          justify-center
                        "
                      >
                        <Icon
                          className="
                            size-[19px]
                            stroke-[1.8]
                          "
                        />
                      </div>

                      {/* TITLE */}

                      <div
                        className="
                          flex
                          min-w-0
                          flex-1
                          items-center

                          opacity-0

                          transition-opacity
                          duration-200

                          group-hover/sidebar:opacity-100
                        "
                      >
                        <span
                          className="
                            flex-1

                            truncate
                            whitespace-nowrap

                            text-left
                            text-[13px]
                            font-medium
                          "
                        >
                          {item.title}
                        </span>

                        <ChevronRight
                          className={`
                            mr-3
                            size-[15px]
                            shrink-0

                            ${
                              isActive
                                ? "text-white/60"
                                : "text-[#62758B]"
                            }
                          `}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* =========================
          BOTTOM SECTION
      ========================== */}

      <div className="shrink-0 px-[10px] pb-[10px]">
        <div
          className="
            mb-2
            border-t
            border-white/[0.08]
            pt-2
          "
        >
          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="
              flex
              h-[44px]
              w-full
              items-center

              overflow-hidden

              rounded-xl

              text-[#91A3B7]

              transition-colors
              duration-200

              hover:bg-white/[0.07]
              hover:text-white
            "
          >
            <div
              className="
                flex
                w-[56px]
                shrink-0
                items-center
                justify-center
              "
            >
              <Bell className="size-[18px] stroke-[1.8]" />
            </div>

            <span
              className="
                whitespace-nowrap

                text-[13px]
                font-medium

                opacity-0

                transition-opacity
                duration-200

                group-hover/sidebar:opacity-100
              "
            >
              Notifications
            </span>
          </button>

          {/* SETTINGS */}

          <button
            type="button"
            className="
              flex
              h-[44px]
              w-full
              items-center

              overflow-hidden

              rounded-xl

              text-[#91A3B7]

              transition-colors
              duration-200

              hover:bg-white/[0.07]
              hover:text-white
            "
          >
            <div
              className="
                flex
                w-[56px]
                shrink-0
                items-center
                justify-center
              "
            >
              <Settings className="size-[18px] stroke-[1.8]" />
            </div>

            <span
              className="
                whitespace-nowrap

                text-[13px]
                font-medium

                opacity-0

                transition-opacity
                duration-200

                group-hover/sidebar:opacity-100
              "
            >
              Settings
            </span>
          </button>

        </div>

        {/* =========================
            PROFILE
        ========================== */}

        <div
          className="
            flex
            h-[62px]
            w-full
            items-center

            overflow-hidden

            rounded-xl

            bg-white/[0.04]

            transition-colors
            duration-200

            hover:bg-white/[0.07]
          "
        >
          {/* AVATAR */}

          <div
            className="
              flex
              w-[56px]
              shrink-0
              items-center
              justify-center
            "
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="
                  size-9
                  rounded-full
                  object-cover

                  ring-2
                  ring-white/10
                "
              />
            ) : (
              <div
                className="
                  flex
                  size-9
                  items-center
                  justify-center

                  rounded-full

                  bg-[#16477C]

                  text-[11px]
                  font-semibold
                  text-white

                  ring-2
                  ring-white/10
                "
              >
                {getInitials(user.name)}
              </div>
            )}
          </div>

          {/* USER DETAILS */}

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center

              opacity-0

              transition-opacity
              duration-200

              group-hover/sidebar:opacity-100
            "
          >
            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate

                  text-[12px]
                  font-semibold

                  text-white
                "
              >
                {user.name}
              </p>

              <p
                className="
                  mt-[2px]

                  truncate

                  text-[10px]

                  text-[#8194AA]
                "
              >
                {roleLabel}
              </p>
            </div>
            <button
              type="button"
              title="Sign out"
              aria-label="Sign out"
              onClick={() => void handleSignOut()}
              className="
                mr-2

                flex
                size-8
                shrink-0
                items-center
                justify-center

                rounded-lg

                text-[#8295AA]

                transition-colors
                duration-200

                hover:bg-red-500/10
                hover:text-red-400
              "
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
