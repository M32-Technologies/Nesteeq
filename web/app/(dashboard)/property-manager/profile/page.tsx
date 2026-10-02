import type { Metadata } from "next"
import { ManagementProfile } from "@/components/profile/management/ManagementProfile"

export const metadata: Metadata = {
  title: "My Profile | Nesteeq",
  description: "Manage your property manager profile and apartment details.",
}

export default function PropertyManagerProfilePage() {
  return <ManagementProfile />
}
