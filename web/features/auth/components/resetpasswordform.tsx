"use client";

import { type ReactNode, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  resetPasswordSchema,
  ResetPasswordFormValues,
} from "../schemas/reset-password";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN" || !token;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const getAuthErrorMessage = (error: unknown) => {
    if (isAuthError(error)) {
      const knownMessages: Record<string, string> = {
        INVALID_TOKEN:
          "This reset link is invalid or expired. Please request a new one.",
        PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
        PASSWORD_TOO_LONG: "Password is too long.",
      };

      return (
        knownMessages[error.code || ""] ||
        error.message ||
        "Unable to reset password. Please try again."
      );
    }

    return error instanceof Error
      ? error.message
      : "Unable to reset password. Please try again.";
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

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (invalidToken) {
      toast.error("This reset link is invalid or expired.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setError("password", { type: "server", message });
        toast.error(message);
        return;
      }

      toast.success("Password reset successfully. Please sign in.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.48,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
      }}
      className="w-full max-w-[460px] rounded-[32px] bg-white px-6 py-7 shadow-[0_26px_80px_rgba(17,17,17,0.12)] sm:px-10 sm:py-10"
    >
      <Link href="/" className="mb-10 inline-flex w-fit items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#09493E] text-base font-semibold text-white">
          N
        </span>
        <span className="text-2xl font-semibold tracking-normal !text-[#111111]">
          Nesteeq
        </span>
      </Link>

      <div className="mb-7">
        <h1 className="mb-2 text-[34px] font-semibold leading-[1.08] tracking-normal !text-[#111111] sm:text-[42px]">
          Reset password
        </h1>
        <p className="text-[15px] leading-6 text-[#4A4A4A]">
          Choose a new password for your Nesteeq account.
        </p>
      </div>

      {invalidToken ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          This reset link is invalid or expired. Please request a new password
          reset email.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldError message={errors.password?.message}>
            <label className="text-sm font-medium text-[#111111]">
              New Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              isVisible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              registration={register("password")}
              placeholder="Enter new password"
            />
          </FieldError>

          <FieldError message={errors.confirmPassword?.message}>
            <label className="text-sm font-medium text-[#111111]">
              Confirm Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              isVisible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              registration={register("confirmPassword")}
              placeholder="Confirm new password"
            />
          </FieldError>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#09493E] px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(9,73,62,0.22)] transition hover:bg-[#05372E] focus:outline-none focus:ring-4 focus:ring-[#09493E]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#09493E] transition hover:text-[#05372E]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </motion.section>
  );
}

function PasswordInput({
  autoComplete,
  isVisible,
  onToggle,
  placeholder,
  registration,
}: {
  autoComplete: string;
  isVisible: boolean;
  onToggle: () => void;
  placeholder: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
      <input
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        {...registration}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-12 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
      />
      <button
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777777] transition hover:text-[#111111]"
      >
        {isVisible ? (
          <Eye className="h-5 w-5" />
        ) : (
          <EyeOff className="h-5 w-5" />
        )}
      </button>
    </div>
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

function ResetPasswordFallback() {
  return (
    <section className="w-full max-w-[460px] rounded-[32px] bg-white px-6 py-10 shadow-[0_26px_80px_rgba(17,17,17,0.12)] sm:px-10">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#09493E]" />
    </section>
  );
}

export default function ResetPasswordForm() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#F5F5F5] px-4 py-6 text-[#111111] sm:px-6">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
