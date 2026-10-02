"use client";

import React, { useState } from "react";
import { Search, Bell, ChevronDown, CheckCheck } from "lucide-react";

interface HeaderProps {
  onSearchGlobal?: (query: string) => void;
}

export function AnnouncementHeader({ onSearchGlobal }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Global Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search residents, flats, announcements..."
            onChange={(e) => onSearchGlobal?.(e.target.value)}
            className="w-full h-10 pl-10 pr-12 text-[13px] bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200/80 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 transition-all outline-none"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="size-10 rounded-xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors relative"
          >
            <Bell className="size-[18px] stroke-[1.8]" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Notifications preview dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[11px] text-[#0F5F45] hover:underline cursor-pointer flex items-center gap-1">
                  <CheckCheck className="size-3" /> Mark all read
                </span>
              </div>
              <div className="py-1 divide-y divide-slate-50 max-h-60 overflow-y-auto">
                <div className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <p className="text-[12px] font-medium text-slate-800">Water tank maintenance scheduled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">10 minutes ago</p>
                </div>
                <div className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <p className="text-[12px] font-medium text-slate-800">Block A parking cleaning published</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">2 hours ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Area */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all text-left"
          >
            <div className="size-9 rounded-xl bg-[#0F5F45] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              AM
            </div>
            <div className="hidden sm:block">
              <div className="text-[13px] font-semibold text-slate-900 leading-tight">
                Arjun Menon
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Property Manager
              </div>
            </div>
            <ChevronDown className="size-4 text-slate-400 ml-0.5" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-[13px]">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-medium text-slate-900">Arjun Menon</p>
                <p className="text-[11px] text-slate-500 truncate">arjun.menon@nesteeq.com</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Community Profile
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Staff Management
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Account Settings
                </button>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
