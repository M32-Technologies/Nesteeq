"use client";

import React, { useState } from "react";
import {
  QrCode,
  Plus,
  Search,
  Share2,
  Clock,
  Car,
  CheckCircle2,
  Users,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchResidentGuestPasses } from "../api/resident-dashboard.api";

export function ResidentVisitorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "USED">("ALL");

  const { data: passes = [], isLoading, refetch } = useQuery({
    queryKey: ["resident", "passes", activeTab],
    queryFn: () =>
      fetchResidentGuestPasses({
        status: activeTab === "ALL" ? undefined : activeTab,
      }),
  });

  const displayPasses = passes;

  const filtered = displayPasses.filter((p) => {
    if (activeTab !== "ALL" && p.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.visitorName.toLowerCase().includes(q) ||
        (p.purpose && p.purpose.toLowerCase().includes(q)) ||
        (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Visitors & Guest Passes
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Pre-approve visitor entries, manage gate passes, and review guest logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Visitor pass generation dialog opened.")}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <QrCode className="size-4" />
          <span>New Guest Pass</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#DDE3DF] bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7C8782]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visitors by name or vehicle..."
            className="h-9 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] pl-9 pr-4 text-xs sm:text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition-colors focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-1">
          {(["ALL", "ACTIVE", "USED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-[#07584F] font-semibold shadow-2xs"
                  : "text-[#637083] hover:text-[#111111]"
              }`}
            >
              {tab === "ALL" ? "All Passes" : tab === "ACTIVE" ? "Active" : "Past"}
            </button>
          ))}
        </div>
      </div>

      {/* Passes Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#637083]">
          Loading visitor passes...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-12 text-center space-y-3">
          <Users className="size-8 text-[#7C8782] mx-auto" />
          <p className="text-base font-semibold text-[#111111]">
            No Visitor Passes Found
          </p>
          <p className="text-xs sm:text-sm text-[#637083] max-w-sm mx-auto">
            You have not generated any visitor passes yet. Pre-approve deliveries, family, or service personnel for seamless entry.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => alert("Visitor pass generation dialog opened.")}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Create Guest Pass</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pass) => {
            const isActive = pass.status === "ACTIVE";
            const code = pass.token || (pass._id ? pass._id.slice(-6).toUpperCase() : "PASS");
            return (
              <div
                key={pass._id || pass.id || pass.validFrom}
                className="rounded-lg border border-[#DDE3DF] bg-white p-4.5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {isActive ? "Active Pass" : pass.status}
                    </span>
                    <h3 className="text-base font-semibold text-[#111111] mt-1.5">
                      {pass.visitorName}
                    </h3>
                    <p className="text-xs text-[#637083] font-medium">
                      {pass.purpose || "Guest Visit"}
                    </p>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-lg bg-[#F7F8F5] border border-[#DDE3DF] text-[#07584F]">
                    <QrCode className="size-6" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-[#EEF1F4] pt-3 text-xs text-[#637083]">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-[#7C8782]" />
                    <span>Valid: {new Date(pass.validFrom).toLocaleDateString()}</span>
                  </div>

                  {pass.vehicleNumber && (
                    <div className="flex items-center gap-2">
                      <Car className="size-3.5 text-[#7C8782]" />
                      <span>Vehicle: {pass.vehicleNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold text-[#7C8782] uppercase">Pass Code:</span>
                    <span className="font-mono font-bold text-[#111111]">{code}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF1F4] flex items-center justify-between">
                  <span className="text-[11px] text-[#7C8782]">
                    Gate Barrier Sync Active
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Share pass ${code}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#07584F] hover:underline cursor-pointer"
                  >
                    <Share2 className="size-3" />
                    <span>Share Pass</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
