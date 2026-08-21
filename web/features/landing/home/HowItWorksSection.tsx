"use client";

import { motion } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Set up your community",
    description:
      "Create your apartment community, blocks, flats, and essential property settings.",
    background: "bg-[var(--soft-mint)]",
    iconBackground: "bg-white",
    iconColor: "text-[var(--brand)]",
    titleColor: "text-[var(--ink)]",
    descriptionColor: "text-[var(--text)]",
    numberColor: "text-[var(--brand)]",
  },
  {
    number: "02",
    icon: UserPlus,
    title: "Invite residents & staff",
    description:
      "Add owners, tenants, residents, and staff with access based on their roles.",
    background: "bg-[var(--cream)]",
    iconBackground: "bg-white",
    iconColor: "text-[var(--brand)]",
    titleColor: "text-[var(--ink)]",
    descriptionColor: "text-[var(--text)]",
    numberColor: "text-[var(--brand)]",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Manage everything",
    description:
      "Handle payments, visitors, maintenance, complaints, parking, and daily operations from Nesteeq.",
    background: "bg-[var(--brand-dark)]",
    iconBackground: "bg-white/10",
    iconColor: "text-white",
    titleColor: "text-white",
    descriptionColor: "text-white/65",
    numberColor: "text-white/45",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-[var(--soft-gray)] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1100px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-[600px]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)] sm:text-4xl">
            Get started in three simple steps.
          </h2>

          <p className="mt-4 max-w-[500px] text-sm leading-7 text-[var(--text)] sm:text-base">
            Set up your property, bring your community in, and manage everything
            from one organized workspace.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className={`flex min-h-[330px] flex-col rounded-[24px] p-6 sm:p-7 ${step.background}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold tracking-[0.15em] ${step.numberColor}`}
                  >
                    STEP {step.number}
                  </span>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.iconBackground}`}
                  >
                    <Icon className={`h-5 w-5 ${step.iconColor}`} />
                  </div>
                </div>

                <div className="mt-auto pt-16">
                  <h3
                    className={`text-xl font-semibold tracking-[-0.02em] ${step.titleColor}`}
                  >
                    {step.title}
                  </h3>

                  <p
                    className={`mt-3 text-sm leading-6 ${step.descriptionColor}`}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
