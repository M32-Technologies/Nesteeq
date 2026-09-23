import type { Metadata } from "next"
import SubscriptionsPage from "@/features/admin/subscriptions/components/subscriptions-page"

export const metadata: Metadata = {
  title: "Subscriptions | Nesteeq Admin OS",
  description: "Society active subscriptions, renewal statuses, and tier allocations.",
}

export default function AdminSubscriptionsRoute() {
  return <SubscriptionsPage />
}
