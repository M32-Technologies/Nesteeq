"use client";

import { motion } from "framer-motion";

export default function ProblemStatement() {
  return (
    <section className="bg-[var(--cream)] px-5 py-24 sm:px-7 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[800px] text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)] sm:text-4xl md:text-5xl"
        >
          Apartment management<br className="hidden sm:block" /> shouldn&apos;t feel scattered.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mx-auto mt-6 max-w-[500px] text-base leading-7 text-[var(--text)] sm:text-lg"
        >
          Bring residents, visitors, payments, maintenance and everyday operations into one organized workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-medium tracking-wide text-[var(--text-muted)] sm:gap-x-8"
        >
          <span>Residents</span>
          <span className="text-[var(--border)]">•</span>
          <span>Visitors</span>
          <span className="text-[var(--border)]">•</span>
          <span>Payments</span>
          <span className="text-[var(--border)]">•</span>
          <span>Maintenance</span>
        </motion.div>
      </div>
    </section>
  );
}
