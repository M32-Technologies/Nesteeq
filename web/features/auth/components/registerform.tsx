"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Mail, Phone, User } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register"

import RegisterOtpStep from "./register-otp-step"

type Step = "register" | "otp"

function RegisterForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>("register")
  const [formData, setFormData] =
    useState<RegisterFormValues | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  })

  const sendOtp = async (data: RegisterFormValues) => {
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

      setFormData(data)
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

  const handleBack = () => {
    setStep("register")

    if (formData) {
      reset(formData)
    }
  }

  const handleSuccess = () => {
    toast.success("Your Nesteeq account is ready.")

    router.push("/")
    router.refresh()
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-8 sm:px-6">
    
      <div className="pointer-events-none absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full bg-[var(--soft-mint)] blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-36 -right-32 h-[400px] w-[400px] rounded-full bg-[var(--cream)] blur-[120px]" />

      <section className="relative z-10 w-full max-w-[440px]">
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

        <div className="min-h-[550px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--white)] shadow-[0_18px_50px_rgba(4,59,53,0.07)]">
          <div className="min-h-[550px] px-7 py-8 sm:px-9">
            <AnimatePresence mode="wait" initial={false}>
              {step === "register" ? (
                <motion.div
                  key="register"
                  initial={{
                    opacity: 0,
                    scale: 0.97,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.26,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex min-h-[486px] flex-col"
                >
                  <div className="mb-7 text-center">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                      Create account
                    </p>

                    <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
                      Get started with Nesteeq
                    </h1>

                    <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-6 text-[var(--text)]">
                      Create your account to start setting up and
                      managing your community.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit(sendOtp)}
                    className="space-y-4"
                  >
                    <FormField
                      label="Full name"
                      error={errors.fullName?.message}
                    >
                      <User className="field-icon" />

                      <input
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        {...register("fullName")}
                        className="auth-input"
                      />
                    </FormField>

                    <FormField
                      label="Email address"
                      error={errors.email?.message}
                    >
                      <Mail className="field-icon" />

                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        {...register("email")}
                        className="auth-input"
                      />
                    </FormField>

                    <FormField
                      label="Phone number"
                      error={errors.phone?.message}
                    >
                      <Phone className="field-icon" />

                      <input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        {...register("phone")}
                        className="auth-input"
                      />
                    </FormField>

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

                  <div className="mt-auto border-t border-[var(--border)] pt-5">
                    <p className="text-center text-[13px] text-[var(--text-muted)]">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                formData && (
                  <motion.div
                    key="otp"
                    initial={{
                      opacity: 0,
                      scale: 0.94,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <RegisterOtpStep
                      data={formData}
                      onBack={handleBack}
                      onSuccess={handleSuccess}
                    />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}

type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

function FormField({
  label,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-[var(--ink)]">
        {label}
      </label>

      <div
        className="
          group relative
          [&_.field-icon]:pointer-events-none
          [&_.field-icon]:absolute
          [&_.field-icon]:left-4
          [&_.field-icon]:top-1/2
          [&_.field-icon]:h-[18px]
          [&_.field-icon]:w-[18px]
          [&_.field-icon]:-translate-y-1/2
          [&_.field-icon]:text-[var(--text-muted)]
          [&_.field-icon]:transition-colors
          [&:focus-within_.field-icon]:text-[var(--brand)]

          [&_.auth-input]:h-[50px]
          [&_.auth-input]:w-full
          [&_.auth-input]:rounded-[13px]
          [&_.auth-input]:border
          [&_.auth-input]:border-[var(--border)]
          [&_.auth-input]:bg-[var(--surface)]
          [&_.auth-input]:pl-11
          [&_.auth-input]:pr-4
          [&_.auth-input]:text-[14px]
          [&_.auth-input]:text-[var(--ink)]
          [&_.auth-input]:outline-none
          [&_.auth-input]:transition
          [&_.auth-input]:placeholder:text-[var(--text-muted)]
          [&_.auth-input:hover]:border-[var(--green-sage)]
          [&_.auth-input:focus]:border-[var(--brand)]
          [&_.auth-input:focus]:bg-[var(--white)]
          [&_.auth-input:focus]:ring-4
          [&_.auth-input:focus]:ring-[var(--green-soft)]
        "
      >
        {children}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-[var(--rose)]">
          {error}
        </p>
      )}
    </div>
  )
}

export default RegisterForm
