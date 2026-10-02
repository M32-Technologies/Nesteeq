"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Bell, Car, CreditCard, FileChartColumn, Users, Wrench } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Resident management",
    description: "Keep owners, tenants, residents and apartment details organized.",
    bgClass: "bg-[var(--soft-mint)]",
    textClass: "text-[var(--ink)]",
    descClass: "text-[var(--text)]",
    iconBgClass: "bg-white",
    iconColorClass: "text-[var(--brand)]",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Track complaints, assign work, and follow progress.",
    bgClass: "bg-[var(--cream)]",
    textClass: "text-[var(--ink)]",
    descClass: "text-[var(--text)]",
    iconBgClass: "bg-white",
    iconColorClass: "text-[var(--brand)]",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Manage recurring bills, dues, payments, and digital receipts.",
    bgClass: "bg-[var(--soft-blue)]",
    textClass: "text-[var(--ink)]",
    descClass: "text-[var(--text)]",
    iconBgClass: "bg-white",
    iconColorClass: "text-[var(--brand)]",
  },
  {
    icon: Bell,
    title: "Visitor Management",
    description: "Handle visitor activity, passes, arrivals, and announcements.",
    bgClass: "bg-[var(--soft-peach)]",
    textClass: "text-[var(--ink)]",
    descClass: "text-[var(--text)]",
    iconBgClass: "bg-white",
    iconColorClass: "text-[var(--brand)]",
  },
  {
    icon: Car,
    title: "Parking",
    description: "Manage parking slots, assignments, and availability.",
    bgClass: "bg-[var(--soft-gray)]",
    textClass: "text-[var(--ink)]",
    descClass: "text-[var(--text)]",
    iconBgClass: "bg-white",
    iconColorClass: "text-[var(--brand)]",
  },
  {
    icon: FileChartColumn,
    title: "Reports & Insights",
    description: "View financial, maintenance, and operational information.",
    bgClass: "bg-[#111111]",
    textClass: "text-white",
    descClass: "text-white/70",
    iconBgClass: "bg-white/10",
    iconColorClass: "text-white",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-5 py-20 sm:px-7 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-14 max-w-[620px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            Features
          </p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)] sm:text-4xl"
          >
            Everything your community needs, in one place.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mt-4 max-w-[540px] text-sm leading-7 text-[var(--text)] sm:text-base"
          >
            Manage everyday apartment operations without switching between scattered tools.
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={`group flex flex-col justify-between rounded-[24px] p-7 transition-transform hover:-translate-y-1 ${feature.bgClass}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${feature.iconBgClass} ${feature.iconColorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-8">
                  <h3 className={`text-lg font-semibold tracking-[-0.01em] ${feature.textClass}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-[1.6] ${feature.descClass}`}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-12 flex"
        >
          <Link
            href="/features"
            className="group flex items-center gap-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--brand)]"
          >
            Explore all features
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
