"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Car,
  CreditCard,
  FileChartColumn,
  Megaphone,
  Users,
  Wrench,
} from "lucide-react";

const items = [
  { label: "Residents", icon: Users },
  { label: "Visitors", icon: Bell },
  { label: "Payments", icon: CreditCard },
  { label: "Maintenance", icon: Wrench },
  { label: "Parking", icon: Car },
  { label: "Notices", icon: Megaphone },
  { label: "Reports", icon: FileChartColumn },
];

export default function CommunityLoop() {
  const loopItems = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-black/[0.05] bg-[var(--cream)] py-14 sm:py-16">
      <div className="mb-9 text-center">
        <p className="font-serif text-xl italic tracking-[-0.02em] text-[var(--ink)] sm:text-2xl">
          Everything connected
        </p>
      </div>

      <div
        className="
          overflow-hidden
          [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
        "
      >
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex w-max items-center"
        >
          {loopItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={`${item.label}-${index}`}
                className="flex shrink-0 items-center"
              >
                <div className="flex items-center gap-3 px-7 sm:px-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                    <Icon className="h-[18px] w-[18px] text-[var(--brand)]" />
                  </div>

                  <span className="text-[15px] font-medium tracking-[-0.01em] text-[var(--ink)] sm:text-base">
                    {item.label}
                  </span>
                </div>

                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]/30" />
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
