"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { NotificationSocketListener } from "@/features/notifications";
import { GlobalApartmentInactiveListener } from "@/components/global-apartment-inactive-listener";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationSocketListener />
      <GlobalApartmentInactiveListener />
      {children}
    </QueryClientProvider>
  );
}
