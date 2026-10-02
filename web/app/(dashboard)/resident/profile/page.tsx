import type { Metadata } from "next"
import ResidentProfilePage from "@/features/dashboard/resident/components/resident-profile-page"

export const metadata: Metadata = {
  title: "My Profile | Nesteeq",
  description: "View and manage your resident profile details.",
}

export default function ResidentProfileRoute() {
  return <ResidentProfilePage />
}
