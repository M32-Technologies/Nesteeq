import type { Metadata } from "next";
import { AnnouncementsPageContent } from "@/features/announcements/components/announcements-page-content";

export const metadata: Metadata = {
  title: "Announcements | Security Dashboard",
  description: "View community announcements and broadcast emergency notices.",
};

export default function SecurityAnnouncementsPage() {
  return <AnnouncementsPageContent />;
}
