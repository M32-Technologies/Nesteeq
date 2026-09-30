"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronRight,
  CircleDollarSign,
  Coins,
  ReceiptText,
  TrendingDown,
} from "lucide-react";

import {
  FinanceSummary,
  getFinanceSummary,
} from "../services/treasurer.service";
import { formatCurrency } from "../utils/format";

interface TreasurerSummaryCardsProps {
  summary?: FinanceSummary;
  isLoading?: boolean;
}

export default function TreasurerSummaryCards({
  summary: propSummary,
  isLoading: propLoading,
}: TreasurerSummaryCardsProps) {
  // If not passed via props, fallback to individual query
  const summaryQuery = useQuery({
    queryKey: ["treasurer", "finance-summary"],
    queryFn: getFinanceSummary,
    enabled: propSummary === undefined && propLoading === undefined,
  });

  const isLoading = propLoading !== undefined ? propLoading : summaryQuery.isLoading;
  const summary = propSummary ?? summaryQuery.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
          />
        ))}
      </div>
    );
  }

  const totalCollection = summary?.totalCollection ?? 0;
  const totalOutstanding = summary?.totalOutstanding ?? 0;
  const totalOverdue = summary?.totalOverdue ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const currentBalance =
    summary?.currentBalance ?? totalCollection - totalExpenses;

  const cards = [
    {
      title: "TOTAL COLLECTIONS",
      value: formatCurrency(totalCollection),
      subtext: "Received maintenance & dues",
      icon: CircleDollarSign,
      gradient: "from-[#07584F] to-[#0F766E]",
      iconBg: "bg-emerald-50 text-[#07584F]",
      hoverBorder: "hover:border-[#07584F]/50",
      href: "/treasurer/payments",
      actionText: "View Receipts",
      badge: "Realized",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    },
    {
      title: "OUTSTANDING DUES",
      value: formatCurrency(totalOutstanding),
      subtext: "Pending maintenance billing",
      icon: ReceiptText,
      gradient: "from-amber-400 to-amber-600",
      iconBg: "bg-amber-50 text-amber-600",
      hoverBorder: "hover:border-amber-400/60",
      href: "/treasurer/billing",
      actionText: "Manage Bills",
      badge: totalOutstanding > 0 ? "Pending" : "Cleared",
      badgeColor:
        totalOutstanding > 0
          ? "bg-amber-50 text-amber-700 border-amber-200/70"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    },
    {
      title: "OVERDUE AMOUNT",
      value: formatCurrency(totalOverdue),
      subtext: "Past payment deadlines",
      icon: AlertCircle,
      gradient: "from-rose-500 to-red-600",
      iconBg: "bg-rose-50 text-rose-600",
      hoverBorder: "hover:border-rose-400/60",
      href: "/treasurer/billing",
      actionText: "Review Overdue",
      badge: totalOverdue > 0 ? "Action Needed" : "Zero Overdue",
      badgeColor:
        totalOverdue > 0
          ? "bg-rose-50 text-rose-700 border-rose-200/70"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    },
    {
      title: "APPROVED EXPENSES",
      value: formatCurrency(totalExpenses),
      subtext: "Operations & maintenance payouts",
      icon: TrendingDown,
      gradient: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-50 text-indigo-600",
      hoverBorder: "hover:border-indigo-400/60",
      href: "/treasurer/expenses",
      actionText: "Expense Log",
      badge: "Disbursed",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    {
      title: "NET CASH SURPLUS",
      value: formatCurrency(currentBalance),
      subtext: "Liquid treasury reserve",
      icon: Coins,
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-50 text-blue-600",
      hoverBorder: "hover:border-blue-400/60",
      href: "/treasurer/reports",
      actionText: "Cashflow",
      badge: currentBalance >= 0 ? "Positive" : "Deficit",
      badgeColor:
        currentBalance >= 0
          ? "bg-blue-50 text-blue-700 border-blue-200/70"
          : "bg-rose-50 text-rose-700 border-rose-200/70",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.hoverBorder}`}
          >
            {/* Top Color Accent Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}
            />

            <div>
              {/* Header: Title + Icon */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div
                  className={`flex size-8 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              {/* Metric Number */}
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                {card.value}
              </h3>

              {/* Subtitle */}
              <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                {card.subtext}
              </p>
            </div>

            {/* Bottom Actions & Status Pill */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${card.badgeColor}`}
              >
                <span className="size-1 rounded-full bg-current" />
                <span>{card.badge}</span>
              </span>

              <Link
                href={card.href}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition group-hover:translate-x-0.5"
              >
                <span>{card.actionText}</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
