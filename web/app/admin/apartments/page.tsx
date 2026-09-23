import type { Metadata } from "next"
import ApartmentsPage from "@/features/admin/apartments/components/apartments-page"

export const metadata: Metadata = {
  title: "Societies & Apartments | Nesteeq Admin OS",
  description: "Manage registered societies, onboarding statuses, and units across the platform.",
}

export default function AdminApartmentsRoute() {
  return <ApartmentsPage />
}
