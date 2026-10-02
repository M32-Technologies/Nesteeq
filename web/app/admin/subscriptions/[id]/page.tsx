import type { Metadata } from "next"
import SubscriptionDetailPage from "@/features/admin/subscriptions/components/subscription-detail-page"

export const metadata: Metadata = {
  title: "Subscription Details | Nesteeq Admin OS",
  description: "View comprehensive subscription lifecycle, plan details, and renewal status.",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminSubscriptionDetailRoute({ params }: Props) {
  const { id } = await params
  return <SubscriptionDetailPage subscriptionId={id} />
}
