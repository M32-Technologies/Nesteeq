import type { Metadata } from "next"
import { ManagementProfile } from "@/components/profile/management/ManagementProfile"

export const metadata: Metadata = {
  title: "My Profile | Nesteeq",
  description: "Manage your treasurer profile details.",
}

export default function TreasurerProfilePage() {
  return <ManagementProfile />
}
