"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useSubscriptionPlans } from "../subscription.query";
import type { SubscriptionPlan } from "../subscription.types";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(price);
};

const getDurationLabel = (durationMonths: number) => {
  if (durationMonths === 1) return "1 month";
  if (durationMonths === 12) return "1 year";

  return `${durationMonths} months`;
};

const getPricePeriod = (durationMonths: number) => {
  if (durationMonths === 1) return "/ month";
  if (durationMonths === 12) return "/ year";

  return `/ ${durationMonths} months`;
};

export default function PricingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const {
    data: plans = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useSubscriptionPlans();

  const monthlyPlan = plans.find((plan) => plan.planType === "MONTHLY");

  const calculateSavings = (plan: SubscriptionPlan) => {
    if (!monthlyPlan || plan.planType === "MONTHLY") {
      return null;
    }

    const regularPrice = monthlyPlan.price * plan.durationMonths;

    const savedAmount = regularPrice - plan.price;

    if (savedAmount <= 0) {
      return null;
    }

    return {
      amount: savedAmount,
      percentage: Math.round((savedAmount / regularPrice) * 100),
    };
  };
  const choosePlan = (planId: string) => {
    if (isSessionPending) return;

    const encodedPlanId = encodeURIComponent(planId);
    const onboardingUrl = `/onboarding?planId=${encodedPlanId}`;

    if (session?.user) {
      router.push(onboardingUrl);
      return;
    }

    toast.error("Register first to select the plan");
    router.push("/register?from=pricing");
  };
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-[1240px] px-5 pb-24 pt-14 sm:px-8 sm:pt-16 lg:px-10 lg:pt-20">
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          className="mx-auto max-w-[720px] text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dce7e3] bg-[#f7faf8] px-3.5 py-1.5">
            <Sparkles className="size-3.5 text-[#07584F]" strokeWidth={2} />

            <span className="text-xs font-semibold text-[#07584F]">
              Simple pricing
            </span>
          </div>

          <h1 className="mt-5 text-[40px] font-semibold leading-[1.06] tracking-[-0.045em] text-[#111111] sm:text-[48px] lg:text-[54px]">
            Choose a plan that fits
            <br />
            <span className="text-[#07584F]">your community.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[590px] text-[15px] leading-7 text-[#68746f]">
            Simple subscription options with everything your apartment community
            needs to manage daily operations.
          </p>
        </motion.div>

        {isPending && (
          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[650px] animate-pulse rounded-[26px] border border-[#e1e7e4] bg-white p-8"
              >
                <div className="h-4 w-24 rounded bg-[#eef2f0]" />

                <div className="mt-5 h-7 w-36 rounded bg-[#eef2f0]" />

                <div className="mt-10 h-12 w-44 rounded bg-[#eef2f0]" />

                <div className="mt-8 h-px bg-[#eef2f0]" />

                <div className="mt-8 space-y-4">
                  {Array.from({
                    length: 7,
                  }).map((_, item) => (
                    <div
                      key={item}
                      className="h-4 w-3/4 rounded bg-[#f3f5f4]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isPending && isError && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-[#e1e7e4] bg-[#fafbfa] px-7 py-8 text-center">
            <RefreshCw className="mx-auto size-5 text-[#07584F]" />

            <h2 className="mt-4 text-lg font-semibold text-[#111111]">
              Unable to load pricing
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#7c8782]">
              We couldn&apos;t load the subscription plans right now.
            </p>

            <button
              type="button"
              disabled={isFetching}
              onClick={() => refetch()}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#07584F] px-4 text-sm font-semibold text-white transition hover:bg-[#064C44] disabled:opacity-60"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Try again
            </button>
          </div>
        )}

        {!isPending && !isError && plans.length > 0 && (
          <>
            <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan, index) => {
                const savings = calculateSavings(plan);

                const isPopular = plan.planType === "SIX_MONTHS";

                return (
                  <motion.article
                    key={plan._id}
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                    }}
                    className={[
                      "relative flex h-full min-h-[620px] flex-col rounded-[26px] border p-7 sm:p-8",
                      "transition-all duration-300",

                      isPopular
                        ? "border-[#07584F] bg-[#f8fbf9] shadow-[0_18px_50px_rgba(7,88,79,0.10)]"
                        : "border-[#dfe6e2] bg-white hover:border-[#b7c9c2]",
                    ].join(" ")}
                  >
                    {/* Header area - same height on all cards */}
                    <div className="min-h-[90px]">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-[#07584F]">
                          {getDurationLabel(plan.durationMonths)}
                        </p>

                        {/* Reserve same badge location */}
                        <div className="flex min-h-[28px] items-center">
                          {isPopular && (
                            <span className="rounded-full bg-[#07584F] px-3 py-1.5 text-[11px] font-semibold text-white">
                              Most popular
                            </span>
                          )}
                        </div>
                      </div>

                      <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.025em] text-[#111111]">
                        {plan.planName}
                      </h2>
                    </div>

                    {/* Price - aligned */}
                    <div className="mt-4 min-h-[100px]">
                      <div className="flex items-end gap-2">
                        <span className="text-[42px] font-semibold leading-none tracking-[-0.05em] text-[#043B35]">
                          ₹{formatPrice(plan.price)}
                        </span>

                        <span className="pb-1 text-sm text-[#89938f]">
                          {getPricePeriod(plan.durationMonths)}
                        </span>
                      </div>

                      {/* Always reserve badge area */}
                      <div className="mt-4 flex min-h-[30px] items-center">
                        {plan.freeTrial.enabled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f0ed] px-3 py-1.5 text-xs font-semibold text-[#07584F]">
                            <Sparkles className="size-3" />
                            {plan.freeTrial.days}
                            -day free trial
                          </span>
                        ) : savings ? (
                          <span className="inline-flex rounded-full bg-[#f2f5f3] px-3 py-1.5 text-xs font-semibold text-[#56625d]">
                            Save {savings.percentage}%
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="my-5 h-px bg-[#e3e9e6]" />

                    {/* Features */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#111111]">
                        Everything included
                      </p>

                      <ul className="mt-5 space-y-3.5">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={`${plan._id}-${featureIndex}`}
                            className="flex items-start gap-3"
                          >
                            <div className="mt-[2px] flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf3ef]">
                              <Check
                                className="size-3 text-[#07584F]"
                                strokeWidth={2.5}
                              />
                            </div>

                            <span className="text-sm leading-5 text-[#56625d]">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA pinned to bottom */}
                    <div className="mt-8">
                      <button
                        onClick={() => choosePlan(plan._id)}
                        className={[
                          "group flex h-12 w-full items-center justify-center gap-2 rounded-xl",
                          "text-sm font-semibold transition",

                          isPopular
                            ? "bg-[#07584F] text-white hover:bg-[#064C44]"
                            : "border border-[#cbd7d2] bg-white text-[#17201c] hover:border-[#07584F] hover:text-[#07584F]",
                        ].join(" ")}
                      >
                        {plan.freeTrial.enabled
                          ? `Start ${plan.freeTrial.days}-day free trial`
                          : "Choose plan"}

                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>

                      {/* Reserve same footer height */}
                      <div className="mt-3 min-h-[18px] text-center">
                        {plan.freeTrial.enabled && (
                          <p className="text-xs text-[#89938f]">
                            Try all features free for {plan.freeTrial.days} days
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Bottom info */}
            <div className="mt-10 flex flex-col gap-5 rounded-[20px] border border-[#dfe6e2] bg-[#fafbfa] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f0ed]">
                  <ShieldCheck className="size-[17px] text-[#07584F]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    Complete access with every plan
                  </p>

                  <p className="mt-1 text-xs text-[#7c8782]">
                    Features and free trials are controlled directly by your
                    subscription plan.
                  </p>
                </div>
              </div>

              <p className="text-xs font-medium text-[#89938f]">
                Transparent pricing · No hidden tiers
              </p>
            </div>
          </>
        )}

        {!isPending && !isError && plans.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-[#7c8782]">
              No active subscription plans available.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
