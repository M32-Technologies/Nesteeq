import type { Metadata } from "next";
import { ResidentAnnouncementsPage } from "@/features/announcements/components/resident/resident-announcements-page";

export const metadata: Metadata = {
  title: "Announcements & Notices | Nesteeq Resident Portal",
  description:
    "Official community notices, maintenance updates, and emergency broadcasts for Greenwood Heights residents.",
};

export default function Page() {
  return <ResidentAnnouncementsPage />;
}
