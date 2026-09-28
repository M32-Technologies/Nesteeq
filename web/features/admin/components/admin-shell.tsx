"use client"

import { useState, type ReactNode } from "react"
import AdminNavbar from "./admin-navbar"
import AdminSidebar from "./admin-sidebar"

export default function AdminShell({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Layout Area: Smoothly transitions padding when sidebar expands on hover */}
      <div className="flex-1 min-w-0 flex flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[76px] lg:peer-hover/sidebar:pl-[260px] bg-[#F1F3F6]">
        {/* Top Navbar */}
        <AdminNavbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Dashboard / Subpage Content */}
        <main className="flex-1 min-w-0 px-6 sm:px-8 pb-10 pt-2 bg-[#F1F3F6]">
          {children}
        </main>
      </div>
    </div>
  )
}
