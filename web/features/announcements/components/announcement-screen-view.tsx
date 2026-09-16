"use client";

import React, { useState } from "react";
import { AnnouncementSidebar } from "./announcement-sidebar";
import { AnnouncementHeader } from "./announcement-header";
import { AnnouncementsPageContent } from "./announcements-page-content";

export function AnnouncementScreenView() {
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased">
      {/* 1. LEFT SIDEBAR: Fixed vertical sidebar around 250px wide */}
      <AnnouncementSidebar currentPath="/announcements" />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. TOP HEADER */}
        <AnnouncementHeader onSearchGlobal={(q) => setGlobalSearch(q)} />

        {/* Page Body Container */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <AnnouncementsPageContent initialSearch={globalSearch} />
        </main>
      </div>
    </div>
  );
}
