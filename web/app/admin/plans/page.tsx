import type { Metadata } from "next"
import PlansPage from "@/features/admin/plans/components/plans-page"

export const metadata: Metadata = {
  title: "Subscription Plans | Nesteeq Admin OS",
  description: "Configure SaaS tiers, billing frequencies, pricing parameters, and feature toggles.",
}

export default function AdminPlansRoute() {
  return <PlansPage />
}
