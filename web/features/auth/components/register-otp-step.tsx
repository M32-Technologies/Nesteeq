"use client"

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import type { RegisterFormValues } from "../schemas/register"

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

type Props = {
  data: RegisterFormValues
  onBack: () => void
  onSuccess: () => void
}

function RegisterOtpStep({
  data,
  onBack,
  onSuccess,
}: Props) {
  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] =
    useState(RESEND_SECONDS)

  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer <= 0) return

    const timer = window.setTimeout(() => {
      setResendTimer((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendTimer])

  const verifyOtp = async () => {
    const code = otp.join("")

    if (code.length !== OTP_LENGTH) {
      toast.error("Enter the complete verification code.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error } =
        await authClient.signIn.emailOtp({
          email: data.email,
          otp: code,
          name: data.fullName,
          phone: data.phone,
        })

      if (error) {
        toast.error(
          error.message ||
            "The verification code is invalid or expired.",
        )
        return
      }

      onSuccess()
    } catch {
      toast.error("Unable to verify your email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value.replace(/\D/g, "")

    if (value.length > 1) {
      fillOtp(value)
      return
    }

    const next = [...otp]
    next[index] = value.slice(-1)

    setOtp(next)

    if (value && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }

    if (event.key === "Enter") {
      event.preventDefault()
      void verifyOtp()
    }
  }

  const handlePaste = (
    event: ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault()

    fillOtp(
      event.clipboardData
        .getData("text")
        .replace(/\D/g, ""),
    )
  }

  const fillOtp = (value: string) => {
    const digits = value.slice(0, OTP_LENGTH).split("")
    const next = Array(OTP_LENGTH).fill("")

    digits.forEach((digit, index) => {
      next[index] = digit
    })

    setOtp(next)

    refs.current[
      Math.min(digits.length, OTP_LENGTH - 1)
    ]?.focus()
  }

  const resendOtp = async () => {
    if (resendTimer || isResending) return

    setIsResending(true)

    try {
      const { error } =
        await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: "sign-in",
        })

      if (error) {
        toast.error("Unable to resend code.")
        return
      }

      setOtp(Array(OTP_LENGTH).fill(""))
      setResendTimer(RESEND_SECONDS)
      refs.current[0]?.focus()

      toast.success("A new code was sent.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-[486px] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-7 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] transition hover:text-[var(--brand)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Change details
      </button>

      <div className="mb-8 text-center">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Verify your email
        </p>

        <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Check your inbox
        </h1>

        <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-6 text-[var(--text)]">
          Enter the 6-digit verification code sent to
        </p>

        <p className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
          {data.email}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void verifyOtp()
        }}
        className="space-y-5"
      >
        <div>
          <label className="mb-3 block text-[13px] font-semibold text-[var(--ink)]">
            Verification code
          </label>

          <div className="flex gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  refs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete={
                  index === 0 ? "one-time-code" : "off"
                }
                onChange={(event) =>
                  handleChange(index, event)
                }
                onKeyDown={(event) =>
                  handleKeyDown(index, event)
                }
                onPaste={handlePaste}
                className="h-[54px] min-w-0 flex-1 rounded-[13px] border border-[var(--border)] bg-[var(--surface)] text-center text-[20px] font-semibold text-[var(--ink)] outline-none transition hover:border-[var(--green-sage)] focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-[var(--green-soft)]"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting || !otp.every(Boolean)
          }
          className="flex h-[50px] w-full items-center justify-center rounded-[13px] bg-[var(--brand)] text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Verify & Continue"
          )}
        </button>
      </form>

      <div className="mt-auto border-t border-[var(--border)] pt-5 text-center">
        <p className="mb-1.5 text-[12px] text-[var(--text-muted)]">
          Didn&apos;t receive the code?
        </p>

        <button
          type="button"
          disabled={resendTimer > 0 || isResending}
          onClick={() => void resendOtp()}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : resendTimer > 0 ? (
            `Resend code in ${resendTimer}s`
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Resend code
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default RegisterOtpStep
