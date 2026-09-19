import type { Metadata } from "next";
import { ResidentVisitorsPage } from "@/features/dashboard/resident/components/resident-visitors-page";

export const metadata: Metadata = {
  title: "Visitors & Guest Passes | Nesteeq Resident Portal",
  description: "Manage pre-approved visitor entries and guest gate passes.",
};

export default function Page() {
  return <ResidentVisitorsPage />;
}
