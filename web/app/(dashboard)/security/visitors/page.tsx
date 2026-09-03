import { Suspense } from "react"

import { SecurityVisitors } from "@/features/dashboard/security/components/SecurityVisitors"

export default function SecurityVisitorsPage() {
  return (
    <Suspense fallback={<p>Loading visitors...</p>}>
      <SecurityVisitors />
    </Suspense>
  )
}
