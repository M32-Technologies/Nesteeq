"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ShieldAlert,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  QrCode,
  Wrench,
  ReceiptText,
  Car,
  Building2,
  Home,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";
import { ResidentSearch } from "./resident-search";

interface ResidentNavbarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function ResidentNavbar({ user }: ResidentNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { flatUnitName, residentRole, apartmentName } = useResidentDashboard();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Sub-navbar navigation pages matching the application's resident modules
  const navTabs: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    {
      label: "Dashboard",
      href: "/resident",
      icon: LayoutDashboard,
    },
    {
      label: "Visitors & Passes",
      href: "/resident/visitors",
      icon: QrCode,
    },
    {
      label: "Complaints & Service",
      href: "/resident/complaints",
      icon: Wrench,
    },
    {
      label: "Bills & Society Finance",
      href: "/resident/bills",
      icon: ReceiptText,
    },
    {
      label: "My Parking",
      href: "/resident/parking",
      icon: Car,
    },
    {
      label: "Announcements",
      href: "/resident/announcements",
      icon: Bell,
    },
    {
      label: "Emergency SOS",
      href: "/resident/alerts",
      icon: ShieldAlert,
    },
  ];

  const isTabActive = (href: string) => {
    if (href === "/resident") {
      return pathname === "/resident";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DDE3DF] bg-white shadow-xs">
      {/* 1. TOP NAVBAR ROW - FULL WIDTH */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand Logo + Resident Portal Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/resident" className="flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#07584F] font-bold text-white shadow-xs transition-colors hover:bg-[#064C44]">
                N
              </div>
              <span className="text-[18px] font-bold tracking-tight text-[#111111]">
                Nesteeq
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#07584F]/10 px-2.5 py-1 text-xs font-semibold text-[#07584F] border border-[#07584F]/20">
              <Building2 className="size-3.5" />
              <span>{apartmentName}</span>
            </span>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <ResidentSearch />
          </div>

          {/* Right: Resident Flat Pill, SOS Alert Button, Bell & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Flat & Role Pill */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] px-3 py-1.5 text-xs font-semibold text-[#111111]">
              <Home className="size-3.5 text-[#07584F]" />
              <span>{flatUnitName}</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="text-[#637083] font-medium">{residentRole}</span>
            </div>

            {/* Emergency SOS Button */}
            <Link
              href="/resident/alerts"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="size-3.5 animate-pulse text-white" />
              <span className="hidden sm:inline">Emergency SOS</span>
              <span className="sm:hidden">SOS</span>
            </Link>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              title="Search Resident Portal"
              className="flex md:hidden size-9 items-center justify-center rounded-lg border border-[#DDE3DF] bg-white text-[#637083] hover:bg-[#F7F8F5] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <Search className="size-4" />
            </button>

            {/* Notifications Bell */}
            <Link
              href="/resident/announcements"
              title="Notices & Broadcasts"
              className="relative flex size-9 items-center justify-center rounded-lg border border-[#DDE3DF] bg-white text-[#637083] hover:bg-[#F7F8F5] hover:text-[#111111] transition-colors"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-lg border border-[#DDE3DF] bg-white p-1 pr-2.5 hover:bg-[#F7F8F5] transition-colors cursor-pointer"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="size-7 rounded-md object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#07584F] text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </div>
                )}

                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-[#111111] leading-tight">
                    {user.name}
                  </p>
                </div>

                <ChevronDown className="size-3.5 text-[#637083]" />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#DDE3DF] bg-white p-2 shadow-lg z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-[#EEF1F4] mb-1">
                    <p className="text-xs font-semibold text-[#111111]">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#637083] truncate">
                      {user.email}
                    </p>
                    <p className="text-[11px] text-[#07584F] font-semibold mt-0.5">
                      {flatUnitName} • {residentRole}
                    </p>
                  </div>

                  <Link
                    href="/resident/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors"
                  >
                    <Settings className="size-3.5 text-[#637083]" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-[#EEF1F4] animate-in fade-in duration-150">
            <ResidentSearch
              isMobileOpen={isMobileSearchOpen}
              onMobileClose={() => setIsMobileSearchOpen(false)}
            />
          </div>
        )}
      </div>

      {/* 2. SUB-NAVBAR ROW: PAGE TABS WITH ICONS - FULL WIDTH */}
      <div className="border-t border-[#EEF1F4] bg-[#FCFCFD]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden">
            {navTabs.map((tab) => {
              const active = isTabActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "bg-[#07584F] text-white shadow-xs font-semibold"
                      : "text-[#637083] hover:bg-slate-100/80 hover:text-[#111111]"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
