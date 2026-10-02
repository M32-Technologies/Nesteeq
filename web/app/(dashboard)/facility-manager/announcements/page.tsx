import type { Metadata } from "next";
import { AnnouncementsPageContent } from "@/features/announcements/components/announcements-page-content";

export const metadata: Metadata = {
  title: "Announcements | Facility Manager",
  description: "Manage facility announcements, maintenance updates, and broadcast emergency notices.",
};

export default function FacilityManagerAnnouncementsPage() {
  return <AnnouncementsPageContent />;
}
