"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/lib/auth-client"
import DashboardSidebar from "@/features/dashboard/components/dashboard-sidebar"
import { normalizeDashboardRole } from "@/features/dashboard/config/sidebar-navigation"

type DashboardSessionUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

export default function DashboardShell({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login")
    }
  }, [isPending, router, session?.user])

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F7F9FB] text-sm font-medium text-[#5D6B7A]">
        Loading dashboard
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = session.user as DashboardSessionUser
  const role = normalizeDashboardRole(user.role)
  const displayName =
    user.name || user.email?.split("@")[0] || "Dashboard user"

  return (
    <div className="min-h-svh bg-[#F7F9FB]">
      <DashboardSidebar
        role={role}
        user={{
          name: displayName,
          email: user.email || "",
          image: user.image || undefined,
        }}
      />

      <main className="min-h-svh px-5 py-5 lg:pl-[108px]">
        {children}
      </main>
    </div>
  )
}
