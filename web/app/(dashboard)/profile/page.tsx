import type { Metadata } from "next"
import { ManagementProfile } from "@/components/profile/management/ManagementProfile"
import { StaffProfile } from "@/components/profile/staff/StaffProfile"
import { getCurrentDashboardSession } from "@/lib/dashboard-auth"

export const metadata: Metadata = {
  title: "My Profile | Nesteeq",
  description: "View and manage your profile details.",
}

export default async function ProfilePage() {
  const session = await getCurrentDashboardSession()
  const role = session?.role

  if (role === "security_staff" || role === "maintenance_technician") {
    return <StaffProfile />
  }

  return <ManagementProfile />
}
