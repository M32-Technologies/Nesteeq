"use client";

import React from "react";
import { useResidentDashboard } from "../../hooks/use-resident-dashboard";
import { ResidentHeader } from "./resident-header";
import { ResidentMetricsBar } from "./resident-metrics-bar";
import { ResidentQuickActions } from "./resident-quick-actions";
import { ResidentVisitorsCard } from "./resident-visitors-card";
import { ResidentComplaintsCard } from "./resident-complaints-card";
import { ResidentDuesCard } from "./resident-dues-card";
import { ResidentParkingCard } from "./resident-parking-card";
import { ResidentAnnouncementsWidget } from "./resident-announcements-widget";
import { ResidentActivityTimeline } from "./resident-activity-timeline";

export function ResidentDashboardView() {
  const {
    userName,
    flatId,
    activeComplaintsCount,
    activeVisitorsCount,
    guestPasses,
    complaintsList,
    announcements,
    criticalAlert,
    isVisitorsLoading,
    isComplaintsLoading,
    isAnnouncementsLoading,
    refetchAll,
  } = useResidentDashboard();

  const latestComplaint = complaintsList[0];
  const latestVisitor = guestPasses[0];

  return (
    <div className="space-y-6 pb-14 max-w-7xl mx-auto">
      {/* 1. Header Greeting & Context */}
      <ResidentHeader
        userName={userName}
        unitText={`Unit ${flatId}`}
        hasCriticalAlert={Boolean(criticalAlert)}
        onRefresh={refetchAll}
      />

      {/* 2. KPI Metrics Summary Bar (4 Cards) */}
      <ResidentMetricsBar
        unitNumber={`Unit ${flatId}`}
        activeComplaintsCount={activeComplaintsCount}
        activeVisitorsCount={activeVisitorsCount}
        latestComplaintTitle={latestComplaint?.title}
        latestVisitorName={latestVisitor?.visitorName}
      />

      {/* 3. Quick Action Bar */}
      <ResidentQuickActions />

      {/* 4. Two-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visitors, Complaints, Dues (7 cols on lg/xl) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Upcoming Visitors & Deliveries */}
          <ResidentVisitorsCard
            guestPasses={guestPasses}
            isLoading={isVisitorsLoading}
          />

          {/* Recent Maintenance & Complaints */}
          <ResidentComplaintsCard
            complaints={complaintsList}
            isLoading={isComplaintsLoading}
          />

          {/* Verified Ownership & Dues Summary */}
          <ResidentDuesCard />
        </div>

        {/* Right Column: Parking, Announcements, Activity (5 cols on lg/xl) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          {/* Assigned Bay & Vehicles */}
          <ResidentParkingCard />

          {/* Latest Announcements */}
          <ResidentAnnouncementsWidget
            announcements={announcements}
            isLoading={isAnnouncementsLoading}
          />

          {/* Live Unit Activity Timeline */}
          <ResidentActivityTimeline />
        </div>
      </div>
    </div>
  );
}
