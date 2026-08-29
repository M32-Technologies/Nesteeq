"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import {
  getDashboardRoleRouteSegment,
  normalizeDashboardRole,
} from "@/features/dashboard/config/sidebar-navigation"
import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/login"
import { useAcceptInvite } from "../hooks/useAcceptInvite"
import { useResolveInvite } from "../hooks/useResolveInvite"
import LoginOtpStep from "./login-otp-step"

type LoginStep = "email" | "otp"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken =
    searchParams.get("inviteToken") ??
    searchParams.get("token") ??
    searchParams.get("invite")
  const fromPricing = searchParams.get("from") === "pricing"

  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  })
  const { data: inviteData, isError: isInviteError } =
    useResolveInvite(inviteToken)

  useEffect(() => {
    if (inviteData?.email) {
      reset({ email: inviteData.email })
    }
  }, [inviteData, reset])

  const acceptInviteMutation = useAcceptInvite()

  const sendOtp = async (data: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      const { error } =
        await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: "sign-in",
        })

      if (error) {
        toast.error(
          error.message || "Unable to send verification code.",
        )
        return
      }

      setEmail(data.email)
      setStep("otp")

      toast.success("Verification code sent.")
    } catch {
      toast.error(
        "Unable to send verification code. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangeEmail = () => {
    setStep("email")
    reset({ email })
  }

  const handleLoginSuccess = async () => {
    let acceptedRole: string | undefined

    if (inviteToken) {
      try {
        const acceptedInvite =
          await acceptInviteMutation.mutateAsync(inviteToken)

        acceptedRole = acceptedInvite.role
      } catch {
        toast.error(
          "We couldn't apply your invite. Please contact your manager.",
        )
      }
    }

    const { data } = await authClient.getSession()

    toast.success("Welcome back to Nesteeq.")

    const role = normalizeDashboardRole(acceptedRole ?? data?.user?.role)

    if (fromPricing) {
      router.push("/pricing")
    } else {
      router.push(`/${getDashboardRoleRouteSegment(role)}`)
    }

    router.refresh()
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-8 sm:px-6">
      {/* Background shapes */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full bg-[var(--soft-mint)] blur-[110px]" />

      <div className="pointer-events-none absolute -bottom-36 -right-32 h-[400px] w-[400px] rounded-full bg-[var(--cream)] blur-[120px]" />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--brand)] text-sm font-bold text-white">
            N
          </span>

          <span className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Nesteeq
          </span>
        </Link>

        {/* Invite banner */}
        {inviteToken && inviteData?.email && (
          <div className="mb-4 rounded-[13px] border border-[var(--border)] bg-[var(--soft-mint)] px-4 py-3 text-center text-[13px] text-[var(--ink)]">
            You&apos;ve been invited to join Nesteeq as{" "}
            <span className="font-semibold">{inviteData.email}</span>.
            Verify below to activate your account.
          </div>
        )}

        {inviteToken && isInviteError && (
          <div className="mb-4 rounded-[13px] border border-[var(--rose)]/30 bg-[var(--rose)]/10 px-4 py-3 text-center text-[13px] text-[var(--rose)]">
            This invite link is invalid or has expired. You can still
            sign in normally below.
          </div>
        )}

        {/* Auth card */}
        <div className="min-h-[450px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--white)] shadow-[0_18px_50px_rgba(4,59,53,0.07)]">
          <div className="flex min-h-[450px] flex-col px-7 py-8 sm:px-9">
            <AnimatePresence mode="wait" initial={false}>
              {step === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex min-h-[386px] flex-col"
                >
                  {/* Heading */}
                  <div className="mb-8 text-center">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                      Secure sign in
                    </p>

                    <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
                      Welcome back
                    </h1>

                    <p className="mx-auto mt-3 max-w-[310px] text-[14px] leading-6 text-[var(--text)]">
                      Enter your registered email address to receive a
                      secure verification code.
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit(sendOtp)}
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-[13px] font-semibold text-[var(--ink)]"
                      >
                        Email address
                      </label>

                      <div className="group relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--brand)]" />

                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          readOnly={Boolean(inviteData?.email)}
                          {...register("email")}
                          className="h-[50px] w-full rounded-[13px] border border-[var(--border)] bg-[var(--surface)] pl-11 pr-4 text-[14px] text-[var(--ink)] outline-none transition placeholder:text-[var(--text-muted)] hover:border-[var(--green-sage)] focus:border-[var(--brand)] focus:bg-[var(--white)] focus:ring-4 focus:ring-[var(--green-soft)] read-only:bg-[var(--surface)] read-only:opacity-80"
                        />
                      </div>

                      {errors.email?.message && (
                        <motion.p
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-xs font-medium text-[var(--rose)]"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-[50px] w-full items-center justify-center rounded-[13px] bg-[var(--brand)] text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--green-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </button>
                  </form>

                  {/* Bottom CTA */}
                  <div className="mt-auto border-t border-[var(--border)] pt-5">
                    <p className="text-center text-[13px] text-[var(--text-muted)]">
                      Setting up a new community?{" "}
                      <Link
                        href="/pricing"
                        className="font-semibold text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
                      >
                        Get started
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="min-h-[386px]"
                >
                  <LoginOtpStep
                    email={email}
                    name={inviteData?.fullName}
                    onChangeEmail={handleChangeEmail}
                    onSuccess={handleLoginSuccess}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-[var(--text-muted)]">
          Secure access to your Nesteeq community.
        </p>
      </motion.section>
    </main>
  )
}

export default LoginForm
