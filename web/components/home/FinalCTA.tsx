"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-[var(--brand-dark)] px-5 py-24 sm:px-7 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[800px] text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl"
        >
          One community.<br />
          One organized workspace.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mx-auto mt-8 max-w-[500px] text-base leading-7 text-white/70 sm:text-lg"
        >
          Bring residents, staff, payments, maintenance and daily operations together with Nesteeq.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mt-12"
        >
          <Link
            href="/register"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[var(--brand-dark)] transition-all hover:scale-105 hover:bg-white/90 active:scale-100"
          >
            Get started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
