"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  MessageSquareWarning,
  ReceiptText,
  QrCode,
  Car,
  BellRing,
  BarChart3,
  Settings,
  Building,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  currentPath?: string;
}

export function AnnouncementSidebar({ currentPath = "/announcements" }: SidebarProps) {
  const navItems = [
    { title: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
    { title: "Residents", href: "#residents", icon: Users },
    { title: "Flats", href: "#flats", icon: Building2 },
    { title: "Maintenance", href: "#maintenance", icon: Wrench },
    { title: "Complaints", href: "#complaints", icon: MessageSquareWarning },
    { title: "Billing & Payments", href: "#billing", icon: ReceiptText },
    { title: "Visitors", href: "#visitors", icon: QrCode },
    { title: "Parking", href: "#parking", icon: Car },
    { title: "Announcements", href: "/announcements", icon: BellRing, active: true },
    { title: "Reports", href: "#reports", icon: BarChart3 },
    { title: "Settings", href: "#settings", icon: Settings },
  ];

  return (
    <aside className="w-[250px] shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-20 px-5 flex items-center gap-3 border-b border-slate-100">
        <div className="size-10 rounded-xl bg-[#0F5F45] flex items-center justify-center text-white shadow-sm">
          <ShieldCheck className="size-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-[18px] tracking-tight">Nesteeq</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E7F4EE] text-[#0F5F45] border border-[#D0EADF]">
              AMS
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 truncate">Smarter Communities</p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active || currentPath === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#E7F4EE] text-[#0F5F45] font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div
                className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-[#0F5F45] text-white shadow-xs"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              >
                <Icon className="size-[17px] stroke-[2]" />
              </div>
              <span className="truncate">{item.title}</span>
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-[#0F5F45]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Apartment/Community Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="size-8 rounded-lg bg-[#E7F4EE] text-[#0F5F45] border border-[#D0EADF] flex items-center justify-center shrink-0">
              <Building className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[12px] font-semibold text-slate-900 truncate">
                Green Valley Apartments
              </h4>
              <p className="text-[11px] text-slate-500 truncate">Kochi, Kerala</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-[#0F5F45] bg-[#E7F4EE] hover:bg-[#D0EADF] border border-[#D0EADF] transition-colors"
          >
            <span>View Community</span>
            <ExternalLink className="size-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
