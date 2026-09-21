"use client"

import { useState, type ReactNode } from "react"
import AdminNavbar from "./admin-navbar"
import AdminSidebar from "./admin-sidebar"

export default function AdminShell({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex">
      {/* Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Layout Area: Starts directly at the right edge of the 250px sidebar */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-[250px] bg-[#F8FAF8]">
        {/* Top Navbar */}
        <AdminNavbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Dashboard / Subpage Content */}
        <main className="flex-1 min-w-0 px-6 sm:px-8 pb-8 pt-3 sm:pt-4 bg-[#F8FAF8]">
          {children}
        </main>
      </div>
    </div>
  )
}
