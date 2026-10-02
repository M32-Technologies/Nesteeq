"use client";

import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import Image from "next/image";

type FeatureSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
  image: string;
  imageAlt: string;
  background?: string;
  reverse?: boolean;
  dark?: boolean;
  imageClassName?: string;
};

export default function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  points,
  icon: Icon,
  image,
  imageAlt,
  background = "bg-white",
  reverse = false,
  dark = false,
  imageClassName = "object-cover",
}: FeatureSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 px-5 py-20 sm:px-7 lg:px-10 lg:py-28 ${background}`}
    >
      <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className={reverse ? "lg:order-2" : ""}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              dark
                ? "bg-white/10 text-white"
                : "bg-white text-[var(--brand)]"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <p
            className={`mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              dark ? "text-[#8FC8BA]" : "text-[var(--brand)]"
            }`}
          >
            {eyebrow}
          </p>

          <h2
            className={`mt-3 max-w-[470px] text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl ${
              dark ? "text-white" : "text-[var(--ink)]"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-5 max-w-[480px] text-sm leading-7 sm:text-base ${
              dark ? "text-white/60" : "text-[var(--text)]"
            }`}
          >
            {description}
          </p>

          <div className="mt-7 space-y-3">
            {points.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    dark
                      ? "bg-white/10 text-white"
                      : "bg-[var(--soft-mint)] text-[var(--brand)]"
                  }`}
                >
                  <Check className="h-3 w-3" />
                </span>

                <span
                  className={`text-sm font-medium ${
                    dark ? "text-white/80" : "text-[var(--ink)]"
                  }`}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className={reverse ? "lg:order-1" : ""}
        >
          <div
            className={`rounded-[28px] p-3 sm:p-4 ${
              dark ? "bg-white/[0.06]" : "bg-white/70"
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[22px]">
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={imageClassName}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}