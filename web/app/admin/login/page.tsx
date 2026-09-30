import { Suspense } from "react"
import type { Metadata } from "next"
import { Loader2 } from "lucide-react"

import AdminLoginVisual from "@/features/admin/components/admin-login-visual"
import AdminLoginForm from "@/features/admin/components/admin-login-form"

export const metadata: Metadata = {
  title: "Admin Portal Login | Nesteeq",
  description: "Sign in to your Nesteeq administration and property governance portal.",
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F4F6F5] p-4 sm:p-6 lg:p-8">
      <main className="grid h-[680px] w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-[24px] border border-[#E1E8E4] bg-white shadow-[0_24px_70px_-12px_rgba(15,23,42,0.09)] sm:rounded-[28px] lg:grid-cols-2">
        {/* Left 50% architectural visual panel */}
        <AdminLoginVisual />

        {/* Right 50% centered admin login form */}
        <Suspense fallback={<AdminLoginFallback />}>
          <AdminLoginForm />
        </Suspense>
      </main>
    </div>
  )
}

function AdminLoginFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white p-12">
      <Loader2 className="h-6 w-6 animate-spin text-[#16704F]" />
    </div>
  )
}
