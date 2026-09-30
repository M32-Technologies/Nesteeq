"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  Clock,
  Send,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronDown,
  MessageSquare,
  Headphones,
  ArrowRight,
  CheckCircle2,
  User,
  FileText,
  Building,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import FinalCTA from "@/features/landing/home/FinalCTA";

const INQUIRY_CATEGORIES = [
  { id: "demo", label: "Schedule a Demo", icon: Sparkles },
  { id: "sales", label: "Product & Pricing", icon: Building2 },
  { id: "support", label: "Technical Support", icon: Headphones },
  { id: "general", label: "General Inquiry", icon: MessageSquare },
];

const FAQS = [
  {
    question: "How long does it take to onboard an entire apartment community?",
    answer:
      "Most societies are fully operational within 24 to 48 hours. Our onboarding team helps you bulk-import residents, units, and parking slots via our Excel template or management tools with zero downtime.",
  },
  {
    question: "Do security guards and maintenance staff need high-end devices?",
    answer:
      "Not at all. Nesteeq's security guard portal and technician views are ultra-lightweight and run smoothly in any mobile or tablet web browser with instant touch-friendly controls.",
  },
  {
    question: "Can our society committee test Nesteeq before making a commitment?",
    answer:
      "Yes! We provide full interactive sandboxes and guided trial setups so property managers, treasurers, and resident association members can experience the platform firsthand.",
  },
  {
    question: "How is our financial, resident, and visitor data kept safe?",
    answer:
      "All community data is protected with bank-grade AES-256 encryption, strict role-based access control (RBAC), and automated daily backups. Resident contact details are shielded from unauthorized visibility.",
  },
  {
    question: "What support channels are provided after launch?",
    answer:
      "Every society gets direct email access to nesteeq.dev@gmail.com with priority escalation, a dedicated onboarding manager, and 24/7 automated monitoring for gate access and SOS emergency services.",
  },
];

export default function ContactPage() {
  const [selectedCategory, setSelectedCategory] = useState("demo");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    apartmentName: "",
    subject: "",
    message: "",
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("nesteeq.dev@gmail.com");
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please fill in your name and message.");
      return;
    }

    const categoryObj = INQUIRY_CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryLabel = categoryObj?.label || "General Inquiry";
    const subjectLine = form.subject.trim()
      ? `[Nesteeq Contact: ${categoryLabel}] ${form.subject.trim()}`
      : `[Nesteeq Contact] ${categoryLabel} from ${form.name.trim()}`;

    const emailBody = [
      `Hello Nesteeq Team,`,
      ``,
      `• Name: ${form.name.trim()}`,
      form.phone.trim() ? `• Phone: ${form.phone.trim()}` : null,
      form.apartmentName.trim()
        ? `• Society / Apartment: ${form.apartmentName.trim()}`
        : null,
      `• Inquiry Type: ${categoryLabel}`,
      form.subject.trim() ? `• Subject: ${form.subject.trim()}` : null,
      ``,
      `--------------------------------------------------`,
      `Message:`,
      form.message.trim(),
      `--------------------------------------------------`,
    ]
      .filter(Boolean)
      .join("\n");

    const mailtoUrl = `mailto:nesteeq.dev@gmail.com?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(emailBody)}`;

    // Directly open email client composer
    window.location.href = mailtoUrl;

    toast.success("Opening your email composer to send to nesteeq.dev@gmail.com!");
  };


  return (
    <main className="min-h-screen bg-[#FDFEFE]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#E8ECE9] bg-gradient-to-b from-[#F4F8F6] via-[#FDFEFE] to-white px-5 pt-32 pb-16 sm:px-7 sm:pt-36 sm:pb-20 lg:px-10 lg:pt-40">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[700px] -translate-x-1/2 rounded-full bg-[#07584F]/10 blur-3xl"
        />

        <div className="mx-auto max-w-[1120px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-[760px] text-center"
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#07584F]/20 bg-[#07584F]/5 px-3.5 py-1.5 text-xs font-semibold text-[#07584F] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#059669] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#059669]" />
              </span>
              <span>We&apos;re here to help • Response within 2 hours</span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Let&apos;s build a smarter, safer community together.
            </h1>

            <p className="mx-auto mt-6 max-w-[620px] text-base leading-relaxed text-[#475569] sm:text-lg">
              Have questions about Nesteeq, want a personalized walkthrough for
              your management committee, or need technical support? Send us a
              message or connect directly.
            </p>
          </motion.div>

          {/* 2. QUICK CONTACT CARDS */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* Card 1: Email */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-[#DDE3DF] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#07584F]/40 hover:shadow-md">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F] transition-colors group-hover:bg-[#07584F] group-hover:text-white">
                  <Mail className="size-5" />
                </div>
                <h2 className="mt-4 text-sm font-bold text-[#0F172A]">
                  Email Us Directly
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Drop us a note anytime. Monitored throughout business hours.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F0]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#07584F] truncate">
                    nesteeq.dev@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copy email address"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#DDE3DF] bg-[#F8FAFC] text-[#475569] hover:bg-[#EEF2F0] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    {copiedEmail ? (
                      <Check className="size-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Schedule Demo */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-[#DDE3DF] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#07584F]/40 hover:shadow-md">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F] transition-colors group-hover:bg-[#07584F] group-hover:text-white">
                  <Sparkles className="size-5" />
                </div>
                <h2 className="mt-4 text-sm font-bold text-[#0F172A]">
                  Executive Demo
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Tailored demonstration for Resident Welfare Associations &
                  Property Managers.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F0]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("demo");
                    document
                      .getElementById("contact-form-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07584F] hover:text-[#064C44] transition-colors cursor-pointer"
                >
                  <span>Request a Walkthrough</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Support Hours */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-[#DDE3DF] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#07584F]/40 hover:shadow-md">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F] transition-colors group-hover:bg-[#07584F] group-hover:text-white">
                  <Clock className="size-5" />
                </div>
                <h2 className="mt-4 text-sm font-bold text-[#0F172A]">
                  Support Window
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Monday to Saturday
                  <br />
                  9:00 AM – 8:00 PM IST
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F0]">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#059669]">
                  <span className="size-1.5 rounded-full bg-[#059669]" />
                  Active Response Team
                </span>
              </div>
            </div>

            {/* Card 4: Enterprise Reliability */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-[#DDE3DF] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#07584F]/40 hover:shadow-md">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F] transition-colors group-hover:bg-[#07584F] group-hover:text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <h2 className="mt-4 text-sm font-bold text-[#0F172A]">
                  System Reliability
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  99.98% uptime SLA with round-the-clock emergency gate & SOS
                  monitoring.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F0]">
                <span className="text-[11px] font-semibold text-[#07584F]">
                  Bank-grade AES-256 Security
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. MAIN FORM & DETAILS SECTION */}
      <section
        id="contact-form-section"
        className="px-5 py-16 sm:px-7 sm:py-20 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-[1120px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-start">
            {/* LEFT COLUMN: THE CONTACT FORM (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[#DDE3DF] bg-white p-6 sm:p-8 md:p-10 shadow-sm">
                <div>
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
                      Send an Inquiry
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
                      How can we help your society?
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
                      Fill out the details below. Clicking Send Message will directly open your email compose window addressed to nesteeq.dev@gmail.com.
                    </p>
                  </div>

                  {/* Category Selection Pills */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-[#0F172A] mb-2.5">
                      Select Inquiry Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {INQUIRY_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#07584F] bg-[#07584F] text-white shadow-xs"
                                : "border-[#DDE3DF] bg-[#F8FAFC] text-[#475569] hover:bg-white hover:text-[#0F172A]"
                            }`}
                          >
                            <Icon className="size-3.5 shrink-0" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inputs */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Name */}
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
                          <input
                            id="contact-name"
                            name="name"
                            type="text"
                            required
                            value={form.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Sajith Kumar"
                            className="w-full rounded-xl border border-[#DDE3DF] bg-[#FDFEFE] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#07584F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#07584F]/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Phone Number{" "}
                          <span className="text-[11px] font-normal text-[#94A3B8]">
                            (Optional)
                          </span>
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
                          <input
                            id="contact-phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleInputChange}
                            placeholder="+91 98000 00000"
                            className="w-full rounded-xl border border-[#DDE3DF] bg-[#FDFEFE] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#07584F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#07584F]/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Apartment Name */}
                      <div>
                        <label
                          htmlFor="contact-apartment"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Community / Society Name{" "}
                          <span className="text-[11px] font-normal text-[#94A3B8]">
                            (Optional)
                          </span>
                        </label>
                        <div className="relative">
                          <Building className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
                          <input
                            id="contact-apartment"
                            name="apartmentName"
                            type="text"
                            value={form.apartmentName}
                            onChange={handleInputChange}
                            placeholder="e.g. Palm Meadows Heights"
                            className="w-full rounded-xl border border-[#DDE3DF] bg-[#FDFEFE] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#07584F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#07584F]/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Subject / Topic{" "}
                          <span className="text-[11px] font-normal text-[#94A3B8]">
                            (Optional)
                          </span>
                        </label>
                        <div className="relative">
                          <FileText className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
                          <input
                            id="contact-subject"
                            name="subject"
                            type="text"
                            value={form.subject}
                            onChange={handleInputChange}
                            placeholder="e.g. Requesting a pilot for 180 flats"
                            className="w-full rounded-xl border border-[#DDE3DF] bg-[#FDFEFE] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#07584F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#07584F]/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="contact-message"
                          className="block text-xs font-semibold text-[#0F172A]"
                        >
                          Detailed Message <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-[#94A3B8]">
                          {form.message.length} characters
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        value={form.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your community, requirements, questions, or timeline..."
                        className="w-full rounded-xl border border-[#DDE3DF] bg-[#FDFEFE] p-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#07584F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#07584F]/20 transition-all resize-y"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        id="contact-submit-button"
                        className="group relative flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#07584F] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#064C44] active:scale-[0.99] cursor-pointer"
                      >
                        <span>Send Message</span>
                        <Send className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      <p className="mt-2.5 text-center text-[11px] text-[#94A3B8]">
                        Clicking &quot;Send Message&quot; directly opens your email composer addressed to nesteeq.dev@gmail.com.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PERKS & DIRECT VALUE (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Highlight Card */}
              <div className="rounded-3xl border border-[#DDE3DF] bg-white p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F]">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      Built for Communities of Every Scale
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Gated villas, towers & multi-block societies
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5 border-t border-[#EEF2F0] pt-5">
                  {[
                    "Zero lock-in during guided trial period",
                    "Assisted bulk data import for flats and residents",
                    "Complimentary staff & guard onboarding training",
                    "Automated billing, digital payments & wallet ledger",
                    "24/7 emergency alert broadcasts & SOS response",
                  ].map((perk, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#07584F]/10 text-[#07584F] mt-0.5">
                        <Check className="size-3" />
                      </div>
                      <span className="text-xs text-[#475569] leading-snug">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Mail Banner Card */}
              <div className="rounded-3xl border border-[#07584F]/20 bg-gradient-to-br from-[#07584F]/5 via-[#07584F]/10 to-transparent p-6 sm:p-7">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#07584F]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#07584F]">
                  <Mail className="size-3" /> Direct Dispatch
                </span>

                <h3 className="mt-3 text-base font-bold text-[#0F172A]">
                  Prefer writing an email from your client?
                </h3>
                <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                  You can reach our founders, developers, and customer operations
                  directly without going through forms.
                </p>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#DDE3DF] bg-white p-3 shadow-xs">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]">
                      Support & Business Email
                    </p>
                    <p className="text-xs font-bold text-[#07584F] truncate">
                      nesteeq.dev@gmail.com
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#064C44] transition-colors cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="size-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Emergency note */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="size-4 text-amber-700" />
                  Existing Community Emergency?
                </p>
                <p className="mt-1 leading-relaxed text-amber-800">
                  If you are an active property manager experiencing a critical
                  security or billing outage, prepend{" "}
                  <code className="bg-amber-100 font-mono px-1 rounded font-bold">
                    [URGENT]
                  </code>{" "}
                  to your subject line for priority alerting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE FAQS ACCORDION */}
      <section className="border-t border-[#EEF2F0] bg-[#F8FAFC] px-5 py-16 sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-[800px]">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
              Got Questions?
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Quick answers about onboarding, security, and community deployment.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#DDE3DF] bg-white transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#0F172A] hover:text-[#07584F] transition-colors cursor-pointer"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-[#64748B] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#07584F]" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 text-xs sm:text-sm leading-relaxed text-[#475569] border-t border-[#EEF2F0] mt-1 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs text-[#64748B]">
              Have a question that isn&apos;t covered here?{" "}
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("contact-form-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-bold text-[#07584F] hover:underline cursor-pointer"
              >
                Ask our team directly
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <FinalCTA />
    </main>
  );
}
