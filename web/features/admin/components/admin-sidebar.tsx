"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutGrid,
  Building2,
  Users,
  Layers,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { adminSidebarItems } from "../config/admin-navigation"
import { cn } from "@/lib/utils"

type AdminSidebarProps = {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  const isSettingsActive =
    pathname === "/admin/settings" || pathname.startsWith("/admin/settings")

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="presentation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        aria-label="Admin navigation sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex h-screen w-[250px] flex-col justify-between bg-white border-r border-[#EEF1EF] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header & Brand (Pure text only - matching 60px navbar height) */}
        <div>
          <div className="flex h-[60px] items-center justify-between px-6">
            <Link
              href="/admin/dashboard"
              onClick={onMobileClose}
              className="text-[23px] font-bold tracking-tight text-[#07584F] select-none hover:opacity-90 transition-opacity"
            >
              Nesteeq
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="mt-1 px-3 space-y-1">
            {adminSidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard"
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors",
                    isActive
                      ? "bg-[#EAF5EE] text-[#14532D] font-semibold"
                      : "text-[#475569] hover:bg-[#F8FAF8] hover:text-[#0F172A]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive ? "text-[#14532D]" : "text-[#64748B]"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: Divider, Settings, and Log Out */}
        <div className="p-3 pb-10 lg:pb-3 border-t border-[#EEF1EF]">
          <nav className="space-y-1">
            {/* Settings */}
            <Link
              href="/admin/settings"
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors",
                isSettingsActive
                  ? "bg-[#EAF5EE] text-[#14532D] font-semibold"
                  : "text-[#475569] hover:bg-[#F8FAF8] hover:text-[#0F172A]"
              )}
            >
              <Settings
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isSettingsActive ? "text-[#14532D]" : "text-[#64748B]"
                )}
              />
              <span className="truncate">Settings</span>
            </Link>

            {/* Log Out (Red text/icon matching reference) */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium text-[#DC2626] hover:bg-rose-50/70 transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 text-[#DC2626]" />
              <span className="truncate">Log Out</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  )
}
