"use client"

import { useSession } from "@/lib/auth-client"

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
          Welcome Back{userName ? <>, <span className="font-semibold text-[#64748B]">{userName}</span></> : null}
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Admin portal command center and overview.
        </p>
      </div>
    </div>
  )
}
