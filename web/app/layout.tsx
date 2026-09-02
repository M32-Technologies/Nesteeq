import type { Metadata } from "next";
import { QueryProvider } from "@/app/provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nesteeq",
  description: "Nesteeq is a modern property management platform for managers, residents, and staff.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" duration={3000} />
      </body>
    </html>
  );
}
