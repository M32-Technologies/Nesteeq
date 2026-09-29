import type { Metadata } from "next"
import { ManagementProfile } from "@/components/profile/management/ManagementProfile"

export const metadata: Metadata = {
  title: "My Profile | Nesteeq",
  description: "Manage your facility manager profile details.",
}

export default function FacilityManagerProfilePage() {
  return <ManagementProfile />
}
