"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  ForgotPasswordFormValues,
} from "../schemas/forgot-password";

function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const getAuthErrorMessage = (error: unknown) => {
    if (isAuthError(error)) {
      const knownMessages: Record<string, string> = {
        RESET_PASSWORD_DISABLED:
          "Password reset is not configured yet. Please contact support.",
      };

      return (
        knownMessages[error.code || ""] ||
        error.message ||
        "Unable to send reset instructions. Please try again."
      );
    }

    return error instanceof Error
      ? error.message
      : "Unable to send reset instructions. Please try again.";
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

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const message = getAuthErrorMessage(error);

        if (error.code === "RESET_PASSWORD_DISABLED") {
          setError("email", { type: "server", message });
        }

        toast.error(message);
        return;
      }

      setSentEmail(data.email);
      toast.success("Password reset instructions sent.");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#F5F5F5] px-4 py-6 text-[#111111] sm:px-6">
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
            Forgot password?
          </h1>
          <p className="text-[15px] leading-6 text-[#4A4A4A]">
            Enter your email and we will send reset instructions if your account exists.
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {sentEmail ? (
            <motion.div
              key="success"
              layout
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-[#DDE8E5] bg-[#09493E]/5 p-5"
            >
              <p className="text-sm font-semibold text-[#09493E]">
                Check your email
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4A4A4A]">
                If an account exists for{" "}
                <span className="font-semibold text-[#111111]">
                  {sentEmail}
                </span>
                , password reset instructions have been sent.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              layout
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FieldError message={errors.email?.message}>
                <label className="text-sm font-medium text-[#111111]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="john@example.com"
                    className="h-11 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
                  />
                </div>
              </FieldError>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#09493E] px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(9,73,62,0.22)] transition hover:bg-[#05372E] focus:outline-none focus:ring-4 focus:ring-[#09493E]/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#09493E] transition hover:text-[#05372E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.section>
    </main>
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

export default ForgotPasswordForm;
