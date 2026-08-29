"use client";

import CollectionOverviewChart from "./CollectionOverviewChart";
import PendingPayments from "./PendingPayments";
import RecentPayments from "./RecentPayments";
import TreasurerSummaryCards from "./TreasurerSummaryCards";

export default function TreasurerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Treasurer Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage collections, dues, expenses and apartment finances.
        </p>
      </div>

      <TreasurerSummaryCards />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Collection Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monthly collection and expense trends.
          </p>

          <div className="mt-6">
            <CollectionOverviewChart />
          </div>
        </div>

        <PendingPayments />
      </div>

      <RecentPayments />
    </div>
  );
}