
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import LoginForm from "@/features/auth/components/loginform"

function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-8 sm:px-6">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
    </main>
  )
}

export default LoginPage
