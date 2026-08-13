import PublicChrome from "@/components/layout/PublicChrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicChrome>{children}</PublicChrome>;
}
