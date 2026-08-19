"use client";

import { motion } from "framer-motion";
import { Briefcase, ShieldCheck, Users, Wrench } from "lucide-react";

const roles = [
  { name: "Property Managers", icon: Briefcase },
  { name: "Residents", icon: Users },
  { name: "Security Teams", icon: ShieldCheck },
  { name: "Maintenance Teams", icon: Wrench },
];

export default function AudienceSection() {
  return (
    <section className="bg-[var(--soft-mint)] px-5 py-20 sm:px-7 lg:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-16 lg:grid-cols-2 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[500px]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            Who Nesteeq Is For
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)] sm:text-4xl">
            One platform.<br />
            Different roles.<br />
            One connected community.
          </h2>

          <div className="mt-12 space-y-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.name} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[var(--brand)] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-medium text-[var(--ink)]">
                    {role.name}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative flex h-[400px] w-full items-center justify-center rounded-3xl bg-white sm:h-[500px]"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute h-px w-[60%] bg-[var(--border)] sm:w-[50%]" />
            <div className="absolute h-[60%] w-px bg-[var(--border)] sm:h-[50%]" />
          </div>

          <div className="absolute z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand)] shadow-lg sm:h-28 sm:w-28">
            <span className="text-sm font-bold tracking-tight text-white sm:text-base">
              NESTEEQ
            </span>
          </div>

          <div className="absolute top-[10%] flex flex-col items-center gap-3 sm:top-[12%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-[var(--text)]">Manager</span>
          </div>

          <div className="absolute bottom-[10%] flex flex-col items-center gap-3 sm:bottom-[12%]">
            <span className="text-xs font-semibold text-[var(--text)]">Maintenance</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>
          </div>

          <div className="absolute left-[5%] flex flex-col items-center gap-3 sm:left-[15%] lg:left-[10%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-[var(--text)]">Resident</span>
          </div>

          <div className="absolute right-[5%] flex flex-col items-center gap-3 sm:right-[15%] lg:right-[10%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-[var(--text)]">Security</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
