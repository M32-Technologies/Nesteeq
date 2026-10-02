import type { Metadata } from "next";
import { AnnouncementScreenView } from "@/features/announcements/components/announcement-screen-view";

export const metadata: Metadata = {
  title: "Announcements | Nesteeq Property Manager",
  description:
    "Manage and broadcast important community announcements, maintenance alerts, and emergency notices for Green Valley Apartments.",
};

export default function AnnouncementsPage() {
  return <AnnouncementScreenView />;
}
