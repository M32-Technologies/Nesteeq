import type { Metadata } from "next"
import { StaffProfile } from "@/components/profile/staff/StaffProfile"

export const metadata: Metadata = {
  title: "Security Staff Profile | Nesteeq",
  description: "View and manage your security staff profile.",
}

export default function SecurityProfilePage() {
  return <StaffProfile />
}
