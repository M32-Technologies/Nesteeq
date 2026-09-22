import type { Metadata } from "next";
import { ResidentBillsPage } from "@/features/dashboard/resident/components/resident-bills-page";

export const metadata: Metadata = {
  title: "Bills & Finance | Nesteeq Resident Portal",
  description: "View society maintenance invoices and pay dues.",
};

export default function Page() {
  return <ResidentBillsPage />;
}
