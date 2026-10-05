"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Wrench } from "lucide-react";
import { toast } from "sonner";

import { TreasurerHeader } from "./TreasurerHeader";
import TreasurerSummaryCards from "./TreasurerSummaryCards";
import { TreasurerFinancialChart } from "./TreasurerFinancialChart";
import PendingPayments from "./PendingPayments";
import RecentPayments from "./RecentPayments";
import {
  getTreasurerDashboard,
  getMaintenancePayouts,
} from "../services/treasurer.service";
import { formatCurrency } from "../utils/format";

export default function TreasurerDashboard() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single unified dashboard query powered by the backend treasurer module
  const dashboardQuery = useQuery({
    queryKey: ["treasurer", "dashboard"],
    queryFn: getTreasurerDashboard,
  });

  // Query incoming approved maintenance bills forwarded by facility managers
  const payoutsQuery = useQuery({
    queryKey: ["treasurer", "maintenance-payouts"],
    queryFn: () => getMaintenancePayouts(),
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["treasurer"] }),
      ]);
      toast.success("Treasury data refreshed.");
    } catch {
      toast.error("Failed to refresh treasury data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const dashboard = dashboardQuery.data;
  const isLoading = dashboardQuery.isLoading;
  const pendingPayouts = (payoutsQuery.data ?? []).filter((p) => !p.isPaid);

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting, role beacon, and quick actions */}
      <TreasurerHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* 2. Top Summary KPI Cards */}
      <TreasurerSummaryCards
        summary={dashboard?.summary}
        isLoading={isLoading}
      />

      {/* 3. Incoming Approved Maintenance Bills Awaiting Payout */}
      {pendingPayouts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  {pendingPayouts.length} Approved Maintenance Bill{pendingPayouts.length > 1 ? "s" : ""} Awaiting Payment
                </h3>
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                  {formatCurrency(
                    pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-800">
                Forwarded by Facility Managers for contractor & technician payout.
              </p>
            </div>
          </div>
          <Link
            href="/treasurer/expenses?tab=maintenance_payouts"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
          >
            Review & Disburse
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Main Analytics Grid: Financial Chart (2 cols) & Pending Dues (1 col) */}
      <div className="grid gap-6 xl:grid-cols-3 items-stretch">
        <div className="xl:col-span-2 flex flex-col">
          <TreasurerFinancialChart
            initialChart={dashboard?.chart}
            isLoading={isLoading}
          />
        </div>

        <div className="xl:col-span-1 flex flex-col">
          <PendingPayments
            pendingDues={dashboard?.pendingDues}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 5. Recent Transactions Ledger */}
      <RecentPayments
        recentPayments={dashboard?.recentPayments}
        isLoading={isLoading}
      />
    </div>
  );
}