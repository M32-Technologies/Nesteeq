"use client";

import FinalCTA from "@/components/home/FinalCTA";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "Free access",
    description:
      "Explore Nesteeq and get started with community management.",
    button: "Start free",
  },
  {
    name: "1 Month",
    price: "₹—",
    period: "1 month access",
    description:
      "A flexible option for communities that want short-term access.",
    button: "Choose 1 month",
  },
  {
    name: "6 Months",
    price: "₹—",
    period: "6 months access",
    description:
      "A balanced option for communities planning to use Nesteeq longer.",
    button: "Choose 6 months",
  },
  {
    name: "1 Year",
    price: "₹—",
    period: "12 months access",
    description:
      "The best long-term option for managing your community with Nesteeq.",
    button: "Choose 1 year",
    featured: true,
    badge: "Best value",
  },
];

const included = [
  "Resident management",
  "Maintenance & complaints",
  "Billing & payments",
  "Visitor management",
  "Parking management",
  "Notifications & reports",
];

export default function PricingPage() {
  return (
    <>
      <div className="bg-white">
        <section className="px-5 pb-10 pt-28 sm:px-7 lg:px-10 lg:pb-12 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-[720px] text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
              Pricing
            </p>

            <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--ink)] sm:text-5xl lg:text-[54px]">
              Simple pricing.
              <br />
              Choose what works for you.
            </h1>

            <p className="mx-auto mt-5 max-w-[540px] text-sm leading-7 text-[var(--text)] sm:text-base">
              Start free or choose the subscription duration that fits your
              community.
            </p>
          </motion.div>
        </section>

        <section className="px-5 pb-24 pt-0 sm:px-7 lg:px-10">
          <div className="mx-auto grid max-w-[1120px] items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.05,
                }}
                className={`relative flex min-h-[520px] flex-col rounded-[24px] bg-[#111111] p-6 text-white sm:p-7 ${
                  plan.featured
                    ? "ring-2 ring-[var(--brand)]"
                    : "ring-1 ring-white/[0.08]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute right-5 top-5 rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <p className="text-sm font-semibold text-white/60">
                    {plan.name}
                  </p>

                  <div className="mt-6">
                    <p className="text-[42px] font-semibold leading-none tracking-[-0.04em]">
                      {plan.price}
                    </p>

                    <p className="mt-3 text-xs text-white/45">
                      {plan.period}
                    </p>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-white/60">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  {included.slice(0, 4).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" />

                      <span className="text-xs text-white/75">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <Link
                    href="/register"
                    className={`group flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                        : "bg-white text-[#111111] hover:bg-white/90"
                    }`}
                  >
                    {plan.button}

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-[#111111] px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1050px] gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                Included with Nesteeq
              </p>

              <h2 className="mt-3 max-w-[430px] text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
                Everything you need to manage your community.
              </h2>

              <p className="mt-4 max-w-[440px] text-sm leading-7 text-white/55">
                Manage residents, payments, maintenance, visitors, parking,
                and everyday community operations from one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[16px] border border-white/[0.08] px-4 py-4"
                >
                  <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" />

                  <span className="text-sm font-medium text-white/80">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </div>
    </>
  );
}
