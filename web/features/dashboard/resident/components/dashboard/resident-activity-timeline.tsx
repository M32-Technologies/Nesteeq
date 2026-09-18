"use client";

import React from "react";
import { Clock, History, CircleDot } from "lucide-react";

export function ResidentActivityTimeline() {
  const activities = [
    {
      id: "1",
      title: "Visitor pass issued for Rahul Sharma",
      time: "10 mins ago",
      channel: "Via Mobile App",
      dotColor: "bg-blue-500",
    },
    {
      id: "2",
      title: "Plumber Ramesh assigned to #REQ-8831",
      time: "2 hours ago",
      channel: "Facility Desk",
      dotColor: "bg-purple-500",
    },
    {
      id: "3",
      title: "Q2 Society Maintenance bill generated",
      time: "Yesterday, 4:15 PM",
      channel: "Accounts Office",
      dotColor: "bg-indigo-500",
    },
  ];

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
          Last 24 hours
        </span>
      </div>

      {/* Timeline Items */}
      <div className="relative pl-6 space-y-4.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 pt-1">
        {activities.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
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
    </div>
  );
}
