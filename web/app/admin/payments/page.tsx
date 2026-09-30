import type { Metadata } from "next"
import PaymentsPage from "@/features/admin/payments/components/payments-page"

export const metadata: Metadata = {
  title: "Payments | Nesteeq Admin OS",
  description: "Global transaction records, payment verifications, and settlement history.",
}

export default function AdminPaymentsRoute() {
  return <PaymentsPage />
}
