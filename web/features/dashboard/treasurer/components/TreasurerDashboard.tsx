"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { TreasurerHeader } from "./TreasurerHeader";
import TreasurerSummaryCards from "./TreasurerSummaryCards";
import { TreasurerFinancialChart } from "./TreasurerFinancialChart";
import PendingPayments from "./PendingPayments";
import RecentPayments from "./RecentPayments";
import { getTreasurerDashboard } from "../services/treasurer.service";

export default function TreasurerDashboard() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single unified dashboard query powered by the backend treasurer module
  const dashboardQuery = useQuery({
    queryKey: ["treasurer", "dashboard"],
    queryFn: getTreasurerDashboard,
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

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting, role beacon, and quick actions */}
      <TreasurerHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* 2. Top Summary KPI Cards */}
      <TreasurerSummaryCards
        summary={dashboard?.summary}
        isLoading={isLoading}
      />

      {/* 3. Main Analytics Grid: Financial Chart (2 cols) & Pending Dues (1 col) */}
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

      {/* 4. Recent Transactions Ledger */}
      <RecentPayments
        recentPayments={dashboard?.recentPayments}
        isLoading={isLoading}
      />
    </div>
  );
}