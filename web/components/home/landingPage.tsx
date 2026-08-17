"use client";

import DashboardShowcase from "./DashboardShowcase";
import CommunityLoop from "./CommunityLoop";
import ProblemStatement from "./ProblemStatement";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import AudienceSection from "@/components/home/AudienceSection";
import PricingPreview from "@/components/home/PricingPreview";
import FinalCTA from "@/components/home/FinalCTA";
import ApartmentImage from "@/public/images/home/hero-apartment.png";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <main id="home" className="bg-white">
        <section className="relative min-h-svh overflow-hidden bg-white">
          <div className="relative mx-auto grid min-h-svh max-w-[1200px] px-5 pt-16 sm:px-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-20 pt-14 sm:pt-16 lg:pt-20"
            >
              <div className="max-w-[540px]">
                <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-[var(--brand)]">
                  SMART APARTMENT MANAGEMENT
                </p>

                <h1 className="text-[42px] font-semibold leading-[1.06] tracking-[-0.035em] text-[var(--ink)] sm:text-[48px] lg:text-[52px]">
                  Manage your community from one calm workspace.
                </h1>

                <p className="mt-6 max-w-[490px] text-[15px] leading-7 text-[var(--text)] sm:text-base">
                  Nesteeq brings residents, visitors, maintenance, payments,
                  and everyday community operations together in one organized
                  platform.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                  >
                    Get started

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="relative hidden h-[calc(100svh-4rem)] lg:block">
              <div className="absolute bottom-[8%] right-[-80px] h-[72%] w-[92%] rounded-[48%_48%_18%_18%] bg-[var(--brand)]/[0.035]" />

              <div className="absolute bottom-[11%] right-[-25px] h-[68%] w-[84%] rounded-[48%_48%_18%_18%] border border-[var(--brand)]/10" />

              <motion.div
                initial={{ opacity: 0, x: 45 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute bottom-0 right-[-35px] z-10 h-[92%] w-[105%]"
              >
                <Image
                  src={ApartmentImage}
                  alt="Modern apartment building"
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 0px"
                  className="object-contain object-bottom"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative mt-8 h-[360px] lg:hidden"
            >
              <div className="absolute bottom-3 left-1/2 h-[290px] w-[280px] -translate-x-1/2 rounded-[48%_48%_15%_15%] bg-[var(--brand)]/[0.035]" />

              <Image
                src={ApartmentImage}
                alt="Modern apartment building"
                fill
                priority
                sizes="(max-width: 1023px) calc(100vw - 40px), 0px"
                className="relative z-10 object-contain object-bottom"
              />
            </motion.div>
          </div>
        </section>

        <DashboardShowcase />

        <CommunityLoop />

        <ProblemStatement />

        <FeaturesSection />

        <HowItWorksSection />

        <AudienceSection />

        <PricingPreview />

        <FinalCTA />
      </main>
    </>
  );
}
