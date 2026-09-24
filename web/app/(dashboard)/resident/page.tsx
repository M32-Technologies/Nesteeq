import type { Metadata } from "next";
import { ResidentDashboardView } from "@/features/dashboard/resident/components/dashboard/resident-dashboard-view";

export const metadata: Metadata = {
  title: "Resident Dashboard | Nesteeq",
  description:
    "Private resident management console for your apartment - Unit overview, visitor passes, dues, maintenance tickets, and notices.",
};

export default function ResidentDashboardPage() {
  return <ResidentDashboardView />;
}
