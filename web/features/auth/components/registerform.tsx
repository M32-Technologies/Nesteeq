"use client";

import { type ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
import { registerSchema, RegisterFormValues } from "../schemas/register";

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const getAuthErrorMessage = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      const knownMessages: Record<string, string> = {
        USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
          "An account with this email already exists. Please sign in or use another email.",
        EMAIL_NOT_VERIFIED:
          "Please verify your email before signing in.",
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

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await signUp.email({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      if (error) {
        const message = getAuthErrorMessage(
          error,
          "Failed to create account. Please try again.",
        );

        if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          setError("email", { type: "server", message });
        }

        toast.error(message);
        return;
      }

      toast.success("We sent an OTP to your email.");
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      toast.error(
        getAuthErrorMessage(
          error,
          "Failed to create account. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#F5F5F5] px-4 py-5 text-[#111111] sm:px-6 lg:px-8">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-white shadow-[0_22px_64px_rgba(17,17,17,0.13)] lg:min-h-[620px] lg:grid-cols-[58fr_42fr]">
        <section className="relative flex min-h-[560px] flex-col items-center bg-white px-6 py-8 sm:px-9 lg:min-h-0 lg:px-12 xl:px-14">
          <Link href="/" className="inline-flex w-full max-w-[390px] items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#09493E] text-base font-semibold text-white">
              N
            </span>
            <span className="text-2xl font-semibold tracking-normal !text-[#111111]">
              Nesteeq
            </span>
          </Link>

          <div className="flex w-full flex-1 items-center justify-center py-8 lg:py-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[390px]"
            >
              <div className="mb-5">
                <h1 className="mb-2 text-[34px] font-semibold leading-[1.05] tracking-normal !text-[#111111] sm:text-[38px]">
                  Create your account
                </h1>
                <p className="text-[15px] leading-6 text-[#4A4A4A]">
                  Start managing your community smarter.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <FieldError message={errors.fullName?.message}>
                  <label className="text-sm font-medium text-[#111111]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
                    <input
                      type="text"
                      autoComplete="name"
                      {...register("fullName")}
                      placeholder="John Doe"
                      className="h-10 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
                    />
                  </div>
                </FieldError>

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
                      className="h-10 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
                    />
                  </div>
                </FieldError>

                <FieldError message={errors.phone?.message}>
                  <label className="text-sm font-medium text-[#111111]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
                    <input
                      type="tel"
                      autoComplete="tel"
                      {...register("phone")}
                      placeholder="+91 9876543210"
                      className="h-10 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
                    />
                  </div>
                </FieldError>

                <FieldError message={errors.password?.message}>
                  <label className="text-sm font-medium text-[#111111]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777777]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("password")}
                      placeholder="Enter your password"
                      className="h-10 w-full rounded-xl border border-[#E6E6E6] bg-white pl-11 pr-12 text-[15px] text-[#111111] outline-none transition placeholder:text-[#777777] hover:border-[#CFCFCF] focus:border-[#09493E] focus:ring-4 focus:ring-[#09493E]/10"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777777] transition hover:text-[#111111]"
                    >
                      {showPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FieldError>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-10 w-full items-center justify-center rounded-xl bg-[#09493E] px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(9,73,62,0.22)] transition hover:bg-[#05372E] focus:outline-none focus:ring-4 focus:ring-[#09493E]/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-[#777777]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#09493E] transition hover:text-[#05372E]"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative hidden min-h-0 overflow-hidden bg-[#042E27] px-8 py-8 text-white lg:flex lg:flex-col xl:px-9">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#09493E]/65" />
          <div className="absolute bottom-[-74px] left-[-74px] h-52 w-52 rounded-full bg-[#09493E]/45" />
          <div className="absolute right-12 top-1/2 h-28 w-28 -translate-y-1/2 rounded-[34px] bg-white/[0.05]" />

          <div className="relative z-10 max-w-[390px]">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-[#C5A059]">
              SMART APARTMENT MANAGEMENT
            </p>
            <h2 className="mb-5 text-[36px] font-semibold leading-[1.08] tracking-normal !text-white xl:text-[40px]">
              Your community,
              <br />
              managed smarter.
            </h2>
            <p className="max-w-[340px] text-[14px] leading-7 text-white/76">
              Everything you need to manage residents, apartments, visitors, and
              everyday community operations &mdash; all in one place.
            </p>
          </div>

          <div className="relative z-10 mt-auto flex flex-1 items-end justify-center pt-8">
            <div className="relative h-[250px] w-full max-w-[340px]">
              <Image
                src="/undraw_coming-home_jmbc.svg"
                alt="Apartment community illustration"
                fill
                priority
                className="object-contain object-bottom drop-shadow-[0_22px_34px_rgba(0,0,0,0.16)]"
              />
            </div>
          </div>
        </section>
      </div>
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

export default RegisterForm;
