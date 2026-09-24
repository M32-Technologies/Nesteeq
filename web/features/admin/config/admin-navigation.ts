import {
  LayoutGrid,
  Building2,
  Users,
  Layers,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type AdminNavItem = {
  title: string
  href: string
  description?: string
}

export type AdminSidebarItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const adminSidebarItems: AdminSidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Apartments",
    href: "/admin/apartments",
    icon: Building2,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: Layers,
  },
  {
    title: "Subscription Management",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: Wallet,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
]
