import type { Metadata } from "next"
import { StaffProfile } from "@/components/profile/staff/StaffProfile"

export const metadata: Metadata = {
  title: "Maintenance Technician Profile | Nesteeq",
  description: "View and manage your maintenance technician profile.",
}

export default function MaintenanceTechnicianProfilePage() {
  return <StaffProfile />
}
