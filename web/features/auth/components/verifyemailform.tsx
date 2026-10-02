"use client";

import { type ReactNode, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const getAuthErrorMessage = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      const knownMessages: Record<string, string> = {
        INVALID_EMAIL: "Enter a valid email address.",
        INVALID_OTP: "The OTP you entered is invalid.",
        OTP_EXPIRED: "This OTP has expired. Please request a new one.",
        TOO_MANY_ATTEMPTS:
          "Too many incorrect attempts. Please request a new OTP.",
        USER_NOT_FOUND: "No account was found for this email.",
      };

      return (
        (error.code && knownMessages[error.code]) || error.message || fallback
      );
    }

    return error instanceof Error ? error.message : fallback;
  };

  const isAuthError = (
    error: unknown,
  ): error is { code?: string; message?: string } => {
    return (
      typeof error === "object" &&
      error !== null &&
      ("message" in error || "code" in error)
    );
  };

  const normalizedEmail = email.trim().toLowerCase();

  const validateInputs = () => {
    if (!normalizedEmail) {
      setFieldError("Enter the email address you used to register.");
      return false;
    }

    if (!/^\d{6}$/.test(otp)) {
      setFieldError("Enter the 6-digit OTP from your email.");
      return false;
    }

    return true;
  };

  const handleVerifyOtp = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsVerifying(true);
    setFieldError("");

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email: normalizedEmail,
        otp,
      });

      if (error) {
        const message = getAuthErrorMessage(
          error,
          "Unable to verify OTP. Please try again.",
        );
        setFieldError(message);
        toast.error(message);
        return;
      }

      toast.success("Email verified successfully. You can sign in now.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        "Unable to verify OTP. Please try again.",
      );
      setFieldError(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!normalizedEmail) {
      setFieldError("Enter your email address before requesting a new OTP.");
      return;
    }

    setIsResending(true);
    setFieldError("");

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "email-verification",
      });

      if (error) {
        const message = getAuthErrorMessage(
          error,
          "Unable to resend OTP. Please try again.",
        );
        setFieldError(message);
        toast.error(message);
        return;
      }

      toast.success("A new OTP has been sent.");
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        "Unable to resend OTP. Please try again.",
      );
      setFieldError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[460px] rounded-[28px] bg-white px-6 py-7 shadow-[0_24px_70px_rgba(17,17,17,0.12)] sm:px-9 sm:py-9"
    >
      <Link href="/" className="mb-8 inline-flex w-fit items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#09493E] text-base font-semibold text-white">
          N
        </span>
        <span className="text-[26px] font-semibold leading-none tracking-normal !text-[#111111]">
          Nesteeq
        </span>
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#09493E] text-white shadow-[0_12px_24px_rgba(9,73,62,0.18)]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="mb-2 text-[32px] font-semibold leading-[1.08] tracking-normal !text-[#111111] sm:text-[36px]">
            Verify email
          </h1>
          <p className="text-[15px] leading-6 text-[#4A4A4A]">
            Enter the OTP sent to your email to activate your account.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <FieldError>
          <label className="text-sm font-medium text-[#111111]">
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError("");
              }}
              placeholder="john@example.com"
              className="h-12 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
            />
          </div>
        </FieldError>

        <FieldError message={fieldError}>
          <label className="text-sm font-medium text-[#111111]">
            Email OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
              setFieldError("");
            }}
            placeholder="123456"
            className="h-12 w-full rounded-xl border border-[#E6E6E6] bg-white px-4 text-center text-[22px] font-semibold tracking-[0.24em] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
          />
        </FieldError>

        <button
          type="button"
          disabled={isVerifying}
          onClick={handleVerifyOtp}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#09493E] px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(9,73,62,0.22)] transition hover:bg-[#05372E] focus:outline-none focus:ring-4 focus:ring-[#09493E]/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isVerifying ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Verify Email"
          )}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isResending}
          onClick={handleResendOtp}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DDE8E5] bg-white px-4 text-sm font-semibold text-[#09493E] transition hover:border-[#BFD5CF] hover:bg-[#09493E]/5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Resend OTP
        </button>

        <Link
          href="/register"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6E6E6] bg-white px-4 text-sm font-semibold text-[#666666] transition hover:border-[#CFCFCF] hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to register
        </Link>
      </div>
    </motion.section>
  );
}

function FieldError({
  children,
  message,
}: {
  children: ReactNode;
  message?: string;
}) {
  return (
    <div className="space-y-2">
      {children}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-600"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <section className="w-full max-w-[500px] rounded-[32px] bg-white px-6 py-10 shadow-[0_26px_80px_rgba(17,17,17,0.12)] sm:px-10">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#09493E]" />
    </section>
  );
}

export default function VerifyEmailForm() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#F5F5F5] px-4 py-6 text-[#111111] sm:px-6">
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
