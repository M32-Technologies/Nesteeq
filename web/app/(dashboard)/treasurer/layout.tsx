import type { ReactNode } from "react";

import { requireCurrentDashboardSession } from "@/lib/dashboard-auth";

export default async function TreasurerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireCurrentDashboardSession();

  return <>{children}</>;
}