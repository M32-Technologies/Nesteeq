"use client";

import React from "react";
import Link from "next/link";
import {
  Coins,
  FilePlus,
  Landmark,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface TreasurerHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TreasurerHeader({
  onRefresh,
  isRefreshing = false,
}: TreasurerHeaderProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Treasurer";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: "🌤️" };
    if (hour < 17) return { text: "Good afternoon", icon: "☀️" };
    return { text: "Good evening", icon: "🌙" };
  };

  const { text: greetingText, icon: greetingIcon } = getGreeting();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
      <div className="space-y-2">
        {/* Title Greeting */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
            {greetingText}, {userName}! {greetingIcon}
          </h1>
        </div>

        {/* Treasurer Context Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F]/10 px-2.5 py-1 font-bold text-[#07584F] border border-[#07584F]/20 shadow-2xs">
            <Landmark className="size-3.5 text-[#07584F]" />
            <span>Treasury & Finance Desk</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700 border border-blue-200/70 shadow-2xs">
            <Coins className="size-3.5 text-blue-600" />
            <span>FY {new Date().getFullYear()} Active Cycle</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200/70 shadow-2xs">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Authorized Officer</span>
          </span>
        </div>
      </div>

      {/* Right Controls: Financial Health Beacon, Quick Actions & Refresh */}
      <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
        {/* Live Status Beacon */}
        <div className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold border shadow-2xs bg-emerald-50/90 text-emerald-800 border-emerald-200/80">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ledger: Active & Balanced</span>
        </div>

        {/* Quick Action: Create Bill */}
        <Link
          href="/treasurer/billing"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#064C44] transition active:scale-95"
        >
          <FilePlus className="size-3.5" />
          <span>Create Bill</span>
        </Link>

        {/* Quick Action: Add Expense */}
        <Link
          href="/treasurer/expenses"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
        >
          <PlusCircle className="size-3.5 text-slate-500" />
          <span>Add Expense</span>
        </Link>

        {/* Quick Action: View Payments */}
        <Link
          href="/treasurer/payments"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
        >
          <WalletCards className="size-3.5 text-slate-500" />
          <span>Payments</span>
        </Link>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard data"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin text-[#07584F]" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default TreasurerHeader;
