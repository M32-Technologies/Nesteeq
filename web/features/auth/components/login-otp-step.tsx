"use client"

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

type LoginOtpStepProps = {
  email: string
  onChangeEmail: () => void
  onSuccess: () => void
}

function LoginOtpStep({
  email,
  onChangeEmail,
  onSuccess,
}: LoginOtpStepProps) {
  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] =
    useState(RESEND_SECONDS)

  const inputRefs = useRef<
    Array<HTMLInputElement | null>
  >([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer <= 0) return

    const timer = window.setTimeout(() => {
      setResendTimer((value) =>
        Math.max(value - 1, 0),
      )
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [resendTimer])

  const verifyOtp = async () => {
    const code = otp.join("")

    if (code.length !== OTP_LENGTH) {
      toast.error(
        "Enter the complete 6-digit verification code.",
      )
      return
    }

    setIsSubmitting(true)

    try {
      const { error } =
        await authClient.signIn.emailOtp({
          email,
          otp: code,
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
      toast.error(
        "Unable to verify the code. Please try again.",
      )
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

    const nextOtp = [...otp]

    nextOtp[index] = value.slice(-1)

    setOtp(nextOtp)

    if (
      value &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        const nextOtp = [...otp]

        nextOtp[index] = ""

        setOtp(nextOtp)

        return
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus()

        const nextOtp = [...otp]

        nextOtp[index - 1] = ""

        setOtp(nextOtp)
      }

      return
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus()
    }

    if (
      event.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus()
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

    const value = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)

    fillOtp(value)
  }

  const fillOtp = (value: string) => {
    const digits = value
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("")

    const nextOtp =
      Array(OTP_LENGTH).fill("")

    digits.forEach((digit, index) => {
      nextOtp[index] = digit
    })

    setOtp(nextOtp)

    const focusIndex = Math.min(
      digits.length,
      OTP_LENGTH - 1,
    )

    inputRefs.current[focusIndex]?.focus()
  }

  const resendOtp = async () => {
    if (
      resendTimer > 0 ||
      isResending
    ) {
      return
    }

    setIsResending(true)

    try {
      const { error } =
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        })

      if (error) {
        toast.error(
          error.message ||
            "Unable to resend verification code.",
        )
        return
      }

      setOtp(
        Array(OTP_LENGTH).fill(""),
      )

      setResendTimer(
        RESEND_SECONDS,
      )

      inputRefs.current[0]?.focus()

      toast.success(
        "A new verification code was sent.",
      )
    } catch {
      toast.error(
        "Unable to resend verification code.",
      )
    } finally {
      setIsResending(false)
    }
  }

  const isComplete =
    otp.every((digit) => digit !== "")

  return (
    <div className="flex min-h-[386px] flex-col">
      {/* Back */}
      <button
        type="button"
        onClick={onChangeEmail}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand)]"
      >
        <ArrowLeft className="h-4 w-4" />

        Change email
      </button>

      {/* Heading */}
      <div className="mb-7 text-center">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Email verification
        </p>

        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
          Check your email
        </h1>

        <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-6 text-[var(--text)]">
          We sent a 6-digit verification code to
        </p>

        <p className="mt-1 break-all text-[14px] font-semibold text-[var(--ink)]">
          {email}
        </p>
      </div>

      {/* OTP form */}
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

          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoComplete={
                  index === 0
                    ? "one-time-code"
                    : "off"
                }
                aria-label={`Verification code digit ${
                  index + 1
                }`}
                onChange={(event) =>
                  handleChange(index, event)
                }
                onKeyDown={(event) =>
                  handleKeyDown(index, event)
                }
                onPaste={handlePaste}
                className="
                  h-[54px]
                  min-w-0
                  flex-1
                  rounded-[13px]
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  text-center
                  text-[20px]
                  font-semibold
                  text-[var(--ink)]
                  outline-none
                  transition-all
                  duration-200

                  hover:border-[var(--green-sage)]
                  hover:bg-[var(--white)]

                  focus:border-[var(--brand)]
                  focus:bg-[var(--white)]
                  focus:ring-4
                  focus:ring-[var(--green-soft)]
                "
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !isComplete
          }
          className="flex h-[50px] w-full items-center justify-center rounded-[13px] bg-[var(--brand)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--green-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Verify & Sign In"
          )}
        </button>
      </form>

      {/* Resend */}
      <div className="mt-auto border-t border-[var(--border)] pt-5 text-center">
        <p className="mb-1.5 text-[12px] text-[var(--text-muted)]">
          Didn&apos;t receive the code?
        </p>

        <button
          type="button"
          onClick={() => {
            void resendOtp()
          }}
          disabled={
            resendTimer > 0 ||
            isResending
          }
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand-hover)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
        >
          {isResending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />

              Sending...
            </>
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

export default LoginOtpStep