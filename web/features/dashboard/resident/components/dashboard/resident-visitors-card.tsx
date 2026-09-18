"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ArrowRight,
  Share2,
  CheckCircle2,
  Clock,
  Car,
  ShieldCheck,
  Package,
  QrCode,
} from "lucide-react";
import type { GuestPassItem } from "../../api/resident-dashboard.api";

interface ResidentVisitorsCardProps {
  guestPasses?: GuestPassItem[];
  isLoading?: boolean;
}

export function ResidentVisitorsCard({
  guestPasses = [],
  isLoading = false,
}: ResidentVisitorsCardProps) {
  // If real guest passes exist from API, format them; otherwise provide rich defaults from design mockup
  const displayItems =
    guestPasses.length > 0
      ? guestPasses.slice(0, 2).map((pass, index) => ({
          id: pass._id || String(index),
          name: pass.visitorName,
          purpose: pass.purpose || "Personal Guest",
          expected: new Date(pass.validFrom).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          vehicle: pass.vehicleNumber || "KA-03-MG-2041",
          passCode: `#QR-${pass._id.slice(-4).toUpperCase()}`,
          isDelivery: pass.purpose?.toLowerCase().includes("delivery"),
          initials: pass.visitorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }))
      : [
          {
            id: "1",
            name: "Rahul Sharma",
            purpose: "Personal Guest",
            expected: "Today, ~5:30 PM",
            vehicle: "KA-03-MG-2041",
            passCode: "#QR-9841",
            isDelivery: false,
            initials: "RS",
          },
          {
            id: "2",
            name: "Swiggy Food Delivery",
            purpose: "In ~15 mins",
            expected: "Tower A Lobby Drop",
            vehicle: "Two-Wheeler",
            passCode: "PIN: #2910",
            isDelivery: true,
            initials: "SW",
          },
        ];

  const handleShare = (name: string, code: string) => {
    if (navigator.share) {
      navigator
        .share({
          title: `Nesteeq Gate Pass for ${name}`,
          text: `Here is your visitor gate pass: ${code}. Present this at the Greenwood Heights security gate.`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(code);
      alert(`Pass ${code} copied to clipboard!`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
              Upcoming Visitors & Deliveries
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Pre-cleared gate passes and security permissions
            </p>
          </div>
        </div>

        <Link
          href="/resident/visitors"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition group"
        >
          <span>View All</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List of Visitors */}
      <div className="space-y-3 pt-1">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition-all duration-200 hover:shadow-xs ${
              item.isDelivery
                ? "border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-white"
                : "border-slate-200/80 bg-gradient-to-r from-blue-50/30 via-white to-white"
            }`}
          >
            {/* Left: Avatar + Details */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
                  item.isDelivery
                    ? "bg-gradient-to-br from-amber-500 to-orange-500"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}
              >
                {item.initials}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {item.name}
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                      item.isDelivery
                        ? "bg-amber-100/90 text-amber-800"
                        : "bg-blue-100/80 text-blue-800"
                    }`}
                  >
                    {item.purpose}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-slate-400" />
                    <span>Expected: {item.expected}</span>
                  </span>
                  {item.vehicle && (
                    <span className="flex items-center gap-1">
                      <Car className="size-3 text-slate-400" />
                      <span>{item.vehicle}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    <span>Pass: {item.passCode}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Gate 1 Auto-entry)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action */}
            <div className="shrink-0 self-end sm:self-center pl-13 sm:pl-0">
              {item.isDelivery ? (
                <button
                  type="button"
                  onClick={() => alert("Gate entry allowed for delivery rider!")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Allow Gate Entry</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleShare(item.name, item.passCode)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer active:scale-95"
                >
                  <Share2 className="size-3.5 text-slate-400" />
                  <span>Share Pass</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
