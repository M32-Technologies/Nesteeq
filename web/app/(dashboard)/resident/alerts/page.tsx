import type { Metadata } from "next"
import { ResidentEmergencyPage } from "@/features/dashboard/resident/components/resident-emergency-page"

export const metadata: Metadata = {
  title: "Emergency & SOS Alert | Nesteeq Resident Portal",
  description:
    "Direct emergency dispatch and SOS alert connection to society gate security and control room.",
}

export default function Page() {
  return <ResidentEmergencyPage />
}
