import type { Metadata } from "next"
import FacilityComplaintsPage from "@/features/dashboard/facility/complaints/components/facility-complaints-page"

export const metadata: Metadata = {
  title: "Complaints | Property Manager | Nesteeq",
  description: "Monitor and manage complaints filed by residents in your apartment.",
}

export default function ComplaintsPage() {
  return <FacilityComplaintsPage eyebrow="Property Manager" />
}
