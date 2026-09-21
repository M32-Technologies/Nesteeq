"use client";

import React, { useMemo } from "react";
import { Clock, History, CircleDot } from "lucide-react";
import { useResidentDashboard } from "../../hooks/use-resident-dashboard";

export function ResidentActivityTimeline() {
  const { guestPasses, complaintsList, announcements } = useResidentDashboard();

  const activities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      time: string;
      channel: string;
      dotColor: string;
      rawDate: Date;
    }> = [];

    for (const p of guestPasses) {
      const d = p.createdAt ? new Date(p.createdAt) : new Date();
      list.push({
        id: `act-pass-${p._id}`,
        title: `Visitor pass created for ${p.visitorName}`,
        time: !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
        channel: "Resident App",
        dotColor: "bg-blue-500",
        rawDate: d,
      });
    }

    for (const c of complaintsList) {
      const d = c.createdAt ? new Date(c.createdAt) : new Date();
      list.push({
        id: `act-comp-${c._id}`,
        title: `Service ticket logged: ${c.title}`,
        time: !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
        channel: "Helpdesk",
        dotColor: "bg-purple-500",
        rawDate: d,
      });
    }

    for (const a of announcements.slice(0, 3)) {
      const d = a.createdAt ? new Date(a.createdAt) : new Date();
      list.push({
        id: `act-ann-${a.id}`,
        title: `Notice broadcasted: ${a.title}`,
        time: !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
        channel: "Management",
        dotColor: "bg-emerald-500",
        rawDate: d,
      });
    }

    return list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 5);
  }, [guestPasses, complaintsList, announcements]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs">
            <History className="size-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
              Live Unit Activity Timeline
            </h3>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-200/60">
          Recent
        </span>
      </div>

      {/* Timeline Items */}
      {activities.length > 0 ? (
        <div className="relative pl-6 space-y-4.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 pt-1">
          {activities.map((item) => (
            <div key={item.id} className="relative group">
              <span
                className={`absolute -left-6 top-1.5 size-2.5 rounded-full ring-4 ring-white ${item.dotColor}`}
              />

              <div className="space-y-0.5">
                <p className="text-xs sm:text-[13px] font-bold text-slate-900">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {item.time} • <span className="text-slate-600">{item.channel}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">No recent activity recorded</p>
          <p className="text-[11px] text-slate-400">
            Visitor passes, service tickets, and notices will log activity events here.
          </p>
        </div>
      )}
    </div>
  );
}
