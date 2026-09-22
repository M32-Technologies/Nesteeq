"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Settings,
  LogOut,
  X,
  HelpCircle,
  Sparkles,
  PanelLeftClose,
  ShieldCheck,
  Radio,
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

      {/* Main Sidebar (Matching reference Bank.LY sidebar) */}
      <aside
        aria-label="Admin navigation sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex h-screen w-[260px] flex-col justify-between bg-white border-r border-[#E5E8EC] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header & Brand */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-[72px] items-center justify-between px-6 border-b border-slate-100/80">
            <Link
              href="/admin/dashboard"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 group select-none"
            >
              {/* Brand Geometric Logo Icon */}
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#07584F] to-[#0A7B6E] text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div className="flex flex-col">
                <span className="text-[19px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
                  Nesteeq
                </span>
                <span className="text-[10px] font-semibold text-[#07584F] tracking-wider uppercase">
                  Admin OS
                </span>
              </div>
            </Link>

            {/* Collapse / Close Indicator */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Sidebar layout"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close mobile navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="mt-4 px-3.5 space-y-1.5">
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
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13.5px] transition-all",
                    isActive
                      ? "bg-white text-[#0F172A] font-bold shadow-xs border border-slate-200/90 ring-1 ring-slate-900/5"
                      : "text-[#64748B] font-medium hover:bg-slate-50 hover:text-[#0F172A]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive ? "text-[#07584F]" : "text-[#94A3B8]"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Help, Logout & Status Card */}
        <div className="p-3.5 border-t border-slate-100/90 space-y-3">
          <nav className="space-y-1">
            {/* Settings */}
            <Link
              href="/admin/settings"
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] transition-colors",
                isSettingsActive
                  ? "bg-slate-100 text-[#0F172A] font-semibold"
                  : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] font-medium"
              )}
            >
              <Settings className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              <span className="truncate">Settings</span>
            </Link>

            {/* Help & Support */}
            <a
              href="mailto:support@nesteeq.com"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-colors"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              <span className="truncate">Help &amp; Support</span>
            </a>

            {/* Log Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-red-50/80 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0 text-[#94A3B8] group-hover:text-red-600" />
              <span className="truncate">Log out</span>
            </button>
          </nav>

          {/* Bottom Card (Matching "Get more with Bank.LY" in the reference) */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#07584F]" />
                Nesteeq Core
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
                <Radio className="h-2.5 w-2.5 text-emerald-600 animate-pulse" />
                Live
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-[#64748B] leading-relaxed">
              Real-time platform monitors &amp; society governance active.
            </p>

            <Link
              href="/admin/plans"
              className="mt-3 block w-full text-center rounded-xl bg-gradient-to-r from-[#07584F] to-[#0A7B6E] py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-opacity"
            >
              Manage Plans
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
