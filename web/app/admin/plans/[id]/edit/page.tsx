import type { Metadata } from "next"
import EditPlanPage from "@/features/admin/plans/components/edit-plan-page"

export const metadata: Metadata = {
  title: "Edit Subscription Plan | Nesteeq Admin OS",
  description: "Modify parameters, limits, and pricing for this subscription tier.",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminEditPlanRoute({ params }: Props) {
  const { id } = await params
  return <EditPlanPage planId={id} />
}
