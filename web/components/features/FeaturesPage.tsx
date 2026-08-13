"use client";

import FeatureSection from "@/components/features/FeatureSection";
import FinalCTA from "@/components/home/FinalCTA";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Building2,
  Car,
  CreditCard,
  FileChartColumn,
  LockKeyhole,
  Mail,
  Users,
  Wrench,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

const featureNav = [
  { label: "Property", href: "#property" },
  { label: "Residents", href: "#residents" },
  { label: "Maintenance", href: "#maintenance" },
  { label: "Payments", href: "#payments" },
  { label: "Visitors", href: "#visitors" },
  { label: "Reports", href: "#reports" },
];

const moreCapabilities = [
  {
    icon: Car,
    title: "Parking management",
    description:
      "Manage parking slots, assignments, availability, and visitor parking.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Keep residents informed about payments, visitors, maintenance, and announcements.",
  },
  {
    icon: LockKeyhole,
    title: "Role-based access",
    description:
      "Give residents, staff, and managers access based on their responsibilities.",
  },
  {
    icon: Building2,
    title: "Multi-community support",
    description:
      "Keep every community, its users, configuration, and data logically separated.",
  },
  {
    icon: Mail,
    title: "Invitations & onboarding",
    description:
      "Bring residents and staff into their community through an organized flow.",
  },
  {
    icon: FileChartColumn,
    title: "Digital records",
    description:
      "Keep important community information and operational history organized.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <main className="bg-white">

        <section className="px-5 pb-20 pt-32 sm:px-7 lg:px-10 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-[1100px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-[760px] text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                Features
              </p>

              <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--ink)] sm:text-5xl lg:text-[56px]">
                Everything that keeps your community moving, connected.
              </h1>

              <p className="mx-auto mt-6 max-w-[610px] text-sm leading-7 text-[var(--text)] sm:text-base">
                From residents and payments to visitors, maintenance, parking,
                and reporting, Nesteeq brings everyday apartment operations
                together in one organized workspace.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                >
                  Get started

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center rounded-full border border-black/[0.08] px-6 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft-gray)]"
                >
                  View pricing
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mx-auto mt-14 max-w-[920px] rounded-[26px] bg-[#101211] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.12)]"
            >
              <div className="relative aspect-video overflow-hidden rounded-[20px]">
                <Image
                  src="/images/home/overview.jpeg"
                  alt="Nesteeq dashboard overview"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 920px"
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <div className="sticky top-16 z-30 border-y border-black/[0.06] bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1100px] gap-1 overflow-x-auto px-5 py-3 sm:px-7 lg:justify-center lg:px-10">
            {featureNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--soft-mint)] hover:text-[var(--brand)]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <FeatureSection
          id="property"
          eyebrow="Property management"
          title="Set the foundation for your entire community."
          description="Configure your apartment community, organize blocks and flats, and keep ownership and occupancy information structured."
          points={[
            "Community configuration",
            "Blocks & flats",
            "Ownership & occupancy",
            "Property settings",
            "Maintenance charge setup",
          ]}
          icon={Building2}
          image="/images/features/community-space.jpg"
          imageAlt="Modern residential community space"
          background="bg-[var(--soft-mint)]"
        />

        <FeatureSection
          id="residents"
          eyebrow="Resident management"
          title="One clear record for every home and resident."
          description="Keep owners, tenants, residents, family members, and occupancy information connected to the correct apartment."
          points={[
            "Owner profiles",
            "Tenant information",
            "Resident records",
            "Family members",
            "Occupancy tracking",
          ]}
          icon={Users}
          image="/images/home/overview.jpeg"
          imageAlt="Nesteeq resident management"
          imageClassName="object-contain bg-white"
          reverse
        />

        <FeatureSection
          id="maintenance"
          eyebrow="Maintenance & complaints"
          title="Move every issue toward resolution."
          description="Give every complaint clear ownership and progress from the moment a resident reports an issue until the work is completed."
          points={[
            "Resident complaints",
            "Facility manager review",
            "Technician assignment",
            "Progress tracking",
            "Completion history",
          ]}
          icon={Wrench}
          image="/images/home/maintaince.jpeg"
          imageAlt="Nesteeq maintenance management"
          imageClassName="object-contain bg-white"
          background="bg-[var(--cream)]"
        />

        <FeatureSection
          id="payments"
          eyebrow="Billing & payments"
          title="Keep every charge, payment and receipt clear."
          description="Generate recurring maintenance bills, track outstanding dues, and maintain an organized payment history for every apartment."
          points={[
            "Recurring maintenance bills",
            "Additional charges",
            "Penalties & fines",
            "Outstanding dues",
            "Digital receipts",
          ]}
          icon={CreditCard}
          image="/images/home/overview.jpeg"
          imageAlt="Nesteeq billing and payment management"
          imageClassName="object-contain bg-white"
          background="bg-[var(--soft-blue)]"
          reverse
        />

        <FeatureSection
          id="visitors"
          eyebrow="Visitor management"
          title="A simpler arrival for residents and security."
          description="Create visitor passes, validate arrivals, record entry and exit activity, and keep residents informed."
          points={[
            "QR visitor passes",
            "Security validation",
            "Entry & exit records",
            "Resident notifications",
            "Manual visitor registration",
          ]}
          icon={Bell}
          image="/images/features/connected-team.png"
          imageAlt="Apartment community and security"
          background="bg-[var(--soft-peach)]"
        />

        <FeatureSection
          id="reports"
          eyebrow="Reports & analytics"
          title="See the whole community more clearly."
          description="Understand financial, payment, maintenance, occupancy, parking, and operational activity without manually combining information."
          points={[
            "Financial reports",
            "Payment summaries",
            "Complaint reports",
            "Maintenance reports",
            "Occupancy & parking information",
          ]}
          icon={FileChartColumn}
          image="/images/home/overview.jpeg"
          imageAlt="Nesteeq reports and analytics"
          imageClassName="object-contain bg-white"
          background="bg-[#101211]"
          dark
          reverse
        />

        <section className="bg-[var(--soft-gray)] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1100px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 max-w-[600px]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                More capabilities
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-4xl">
                Built for the whole community.
              </h2>

              <p className="mt-4 max-w-[520px] text-sm leading-7 text-[var(--text)] sm:text-base">
                Important community operations stay organized in the same
                platform.
              </p>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moreCapabilities.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.04,
                    }}
                    className="rounded-[22px] bg-white p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--soft-mint)] text-[var(--brand)]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-base font-semibold text-[var(--ink)]">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
    </>
  );
}
