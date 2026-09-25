"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Settings,
  LogOut,
  X,
  ShieldCheck,
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
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar: auto-collapsing on desktop with smooth hover expansion */}
      <aside
        aria-label="Admin navigation sidebar"
        className={cn(
          "peer/sidebar group/sidebar fixed top-0 bottom-0 left-0 z-50 flex h-screen w-[260px] flex-col justify-between overflow-hidden bg-white border-r border-[#E5E8EC] transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:w-[76px] lg:translate-x-0 lg:hover:w-[260px]"
        )}
      >
        {/* Top Header & Brand */}
        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100/90 overflow-hidden">
          <Link
            href="/admin/dashboard"
            onClick={onMobileClose}
            className="flex items-center group select-none h-full"
          >
            {/* Brand Logo Icon (Fixed 76px width to remain perfectly centered when collapsed) */}
            <div className="flex w-[76px] shrink-0 items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#07584F] to-[#0A7B6E] text-white shadow-xs ring-1 ring-emerald-900/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            {/* Brand Typography (Fades and slides smoothly on hover) */}
            <div className="flex flex-col min-w-0 transition-all duration-200 translate-x-0 opacity-100 lg:-translate-x-1 lg:opacity-0 lg:group-hover/sidebar:translate-x-0 lg:group-hover/sidebar:opacity-100">
              <span className="text-[18px] font-extrabold tracking-tight text-[#0F172A] leading-tight whitespace-nowrap">
                Nesteeq
              </span>
              <span className="text-[10px] font-semibold text-[#07584F] tracking-wider uppercase whitespace-nowrap">
                Admin OS
              </span>
            </div>
          </Link>

          {/* Close button on mobile only */}
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close mobile navigation"
            className="ml-auto mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="mt-3 flex-1 overflow-x-hidden overflow-y-auto px-2.5 space-y-1 [&::-webkit-scrollbar]:hidden">
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
                title={item.title}
                className={cn(
                  "relative flex h-[46px] w-full items-center overflow-hidden rounded-xl transition-all duration-150 group/item",
                  isActive
                    ? "bg-slate-50 text-[#0F172A] font-semibold shadow-2xs border border-slate-200/90 ring-1 ring-slate-900/5"
                    : "text-[#64748B] font-medium hover:bg-slate-50/80 hover:text-[#0F172A]"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#07584F]"
                    aria-hidden="true"
                  />
                )}

                {/* Icon (56px width, perfectly centered when sidebar is 76px wide) */}
                <div className="flex w-[56px] shrink-0 items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[19px] w-[19px] shrink-0 transition-colors",
                      isActive
                        ? "text-[#07584F]"
                        : "text-[#94A3B8] group-hover/item:text-[#07584F]"
                    )}
                  />
                </div>

                {/* Label (Smoothly revealed on hover) */}
                <div className="flex min-w-0 flex-1 items-center transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100">
                  <span className="truncate whitespace-nowrap text-[13.5px]">
                    {item.title}
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section: Settings & Log Out (Manage Plans & Help & Support removed) */}
        <div className="shrink-0 p-2.5 border-t border-slate-100/90 space-y-1">
          {/* Settings */}
          <Link
            href="/admin/settings"
            onClick={onMobileClose}
            title="Settings"
            className={cn(
              "relative flex h-[44px] w-full items-center overflow-hidden rounded-xl transition-all duration-150 group/item",
              isSettingsActive
                ? "bg-slate-50 text-[#0F172A] font-semibold shadow-2xs border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-[#64748B] font-medium hover:bg-slate-50/80 hover:text-[#0F172A]"
            )}
          >
            {isSettingsActive && (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#07584F]"
                aria-hidden="true"
              />
            )}

            <div className="flex w-[56px] shrink-0 items-center justify-center">
              <Settings
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isSettingsActive
                    ? "text-[#07584F]"
                    : "text-[#94A3B8] group-hover/item:text-[#07584F]"
                )}
              />
            </div>

            <div className="flex min-w-0 flex-1 items-center transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100">
              <span className="truncate whitespace-nowrap text-[13px]">
                Settings
              </span>
            </div>
          </Link>

          {/* Log Out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Log out"
            className="relative flex h-[44px] w-full items-center overflow-hidden rounded-xl text-[#64748B] font-medium hover:bg-red-50/80 hover:text-red-600 transition-colors cursor-pointer group/logout"
          >
            <div className="flex w-[56px] shrink-0 items-center justify-center">
              <LogOut className="h-[18px] w-[18px] shrink-0 text-[#94A3B8] group-hover/logout:text-red-600 transition-colors" />
            </div>

            <div className="flex min-w-0 flex-1 items-center transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100">
              <span className="truncate whitespace-nowrap text-[13px]">
                Log out
              </span>
            </div>
          </button>
        </div>
      </aside>
    </>
  )
}
