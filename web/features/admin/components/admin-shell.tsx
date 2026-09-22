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

      {/* Main Layout Area: Starts directly at the right edge of the 260px sidebar */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-[260px] bg-[#F1F3F6]">
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
