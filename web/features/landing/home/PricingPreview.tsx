"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PricingPreview() {
  return (
    <section
      id="pricing"
      className="bg-[var(--soft-blue)] px-5 py-20 sm:px-7 lg:px-10 lg:py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="mx-auto max-w-[760px] text-center"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Pricing
        </p>

        <h2 className="mx-auto mt-3 max-w-[650px] text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)] sm:text-4xl">
          Flexible subscriptions for every community.
        </h2>

        <p className="mx-auto mt-5 max-w-[520px] text-sm leading-7 text-[var(--text)] sm:text-base">
          Choose a subscription duration that works for your apartment
          community and manage everything with Nesteeq.
        </p>

        <Link
          href="/pricing"
          className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Explore pricing

          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}