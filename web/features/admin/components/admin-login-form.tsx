"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { authClient, isAdminRole } from "@/lib/auth-client"
import {
  adminLoginSchema,
  type AdminLoginFormValues,
} from "../schemas/admin-login.schema"

export default function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUnauthorizedRedirect = searchParams.get("error") === "unauthorized"

  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(
    isUnauthorizedRedirect
      ? "You don't have permission to access the Admin Portal. Please sign in with an administrative account."
      : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: false,
      })

      if (error) {
        const message = error.message || "Invalid email or password. Please try again."
        setAuthError(message)
        toast.error(message)
        return
      }

      const sessionRes = await authClient.getSession()
      const user = sessionRes?.data?.user

      if (!user || !isAdminRole(user.role)) {
        await authClient.signOut()
        const unauthMsg = "You don't have permission to access the Admin Portal."
        setAuthError(unauthMsg)
        toast.error(unauthMsg)
        return
      }

      toast.success("Welcome back, Administrator.")
      router.push("/admin/dashboard")
      router.refresh()
    } catch {
      const netError = "Unable to connect to the authentication service. Please check your network and try again."
      setAuthError(netError)
      toast.error(netError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white p-8 lg:p-12">
      {/* Decorative concentric corner curves from target design */}
      <div 
        className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#EAF3EE] select-none" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-[#DCEEE5] select-none" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-2 -right-2 h-28 w-28 rounded-full bg-[#CFE4D9] select-none" 
        aria-hidden="true" 
      />

      {/* Main Login Form Area */}
      <div className="relative z-10 w-full max-w-[370px]">
        {/* Eyebrow Label */}
        <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#16704F]">
          Admin Portal
        </span>

        {/* Welcome Heading */}
        <h1 className="mb-1 text-[34px] font-bold tracking-tight text-[#0D1F2A] lg:text-[36px]">
          Welcome Back
        </h1>
        <p className="mb-7 text-[14px] text-[#71817B]">
          Sign in to your admin account.
        </p>

        {/* Authentication Error Message */}
        {authError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-3 text-[13px] text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="leading-snug">{authError}</div>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {/* Email Input Field */}
          <div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7E8F87] transition-colors peer-focus:text-[#16704F]" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                aria-label="Email address"
                placeholder="Email address"
                disabled={isSubmitting}
                {...register("email")}
                className="peer h-[52px] w-full rounded-2xl border border-[#E0E6E3] bg-white pl-11 pr-4 text-[14px] text-[#0D1F2A] placeholder:text-[#889890] outline-none transition-all hover:border-[#CAD3CF] focus:border-[#16704F] focus:ring-2 focus:ring-[#16704F]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
              />
            </div>
            {errors.email?.message && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input Field */}
          <div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7E8F87] transition-colors peer-focus:text-[#16704F]" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-label="Password"
                placeholder="Password"
                disabled={isSubmitting}
                {...register("password")}
                className="peer h-[52px] w-full rounded-2xl border border-[#E0E6E3] bg-white pl-11 pr-11 text-[14px] text-[#0D1F2A] placeholder:text-[#889890] outline-none transition-all hover:border-[#CAD3CF] focus:border-[#16704F] focus:ring-2 focus:ring-[#16704F]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#7E8F87] transition-colors hover:bg-slate-100 hover:text-[#0D1F2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16704F]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#16704F] px-5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#115C41] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16704F]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
