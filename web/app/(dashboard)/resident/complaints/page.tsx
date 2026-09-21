import type { Metadata } from "next";
import { ResidentComplaintsPage } from "@/features/dashboard/resident/components/resident-complaints-page";

export const metadata: Metadata = {
  title: "Complaints & Maintenance | Nesteeq Resident Portal",
  description: "Track and log maintenance requests and service complaints.",
};

export default function Page() {
  return <ResidentComplaintsPage />;
}
