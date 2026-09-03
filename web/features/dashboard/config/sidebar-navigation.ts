import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Car,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  MessageSquareWarning,
  Package,
  QrCode,
  ReceiptText,
  Settings,
  UserRound,
  UserRoundCog,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react"

import type { LucideIcon } from "lucide-react"

export type DashboardRole =
  | "super_admin"
  | "property_manager"
  | "treasurer"
  | "facility_manager"
  | "security_staff"
  | "maintenance_technician"
  | "resident"

export type NavigationItem = {
  title: string
  href: string
  icon: LucideIcon  
}

export type NavigationSection = {
  title: string
  items: NavigationItem[]
}

export const DEFAULT_DASHBOARD_ROLE: DashboardRole = "resident"

export const dashboardRoleLabels: Record<DashboardRole, string> = {
  super_admin: "Super Admin",
  property_manager: "Property Manager",
  treasurer: "Treasurer",
  facility_manager: "Facility Manager",
  security_staff: "Security Staff",
  maintenance_technician: "Maintenance Technician",
  resident: "Resident",
}

export const dashboardRoleRouteSegments: Record<DashboardRole, string> = {
  super_admin: "super-admin",
  property_manager: "property-manager",
  treasurer: "treasurer",
  facility_manager: "facility-manager",
  security_staff: "security",
  maintenance_technician: "maintenance-technician",
  resident: "resident",
}

export const sidebarNavigation: Record<
  DashboardRole,
  NavigationSection[]
> = {
  super_admin: [
    {
      title: "Management",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Apartments",
          href: "/dashboard/apartments",
          icon: Building2,
        },
        {
          title: "Users",
          href: "/dashboard/users",
          icon: Users,
        },
        {
          title: "Staff",
          href: "/dashboard/staff",
          icon: UserRoundCog,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          title: "Notifications",
          href: "/dashboard/notifications",
          icon: Bell,
        },
        {
          title: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ],

  property_manager: [
    {
      title: "Management",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Property",
          href: "/dashboard/property",
          icon: Building2,
        },
        {
          title: "Users",
          href: "/dashboard/users",
          icon: Users,
        },
        {
          title: "Staff",
          href: "/dashboard/staff",
          icon: UserRoundCog,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Complaints",
          href: "/dashboard/complaints",
          icon: MessageSquareWarning,
        },
        {
          title: "Maintenance",
          href: "/dashboard/maintenance",
          icon: Wrench,
        },
        {
          title: "Visitors",
          href: "/dashboard/visitors",
          icon: QrCode,
        },
        {
          title: "Parking",
          href: "/dashboard/parking",
          icon: Car,
        },
      ],
    },
    {
      title: "Reports",
      items: [
        {
          title: "Analytics",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          title: "Announcements",
          href: "/dashboard/announcements",
          icon: Bell,
        },
      ],
    },
  ],

  treasurer: [
  {
    title: "Finance",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: ReceiptText,
      },
      {
        title: "Payments",
        href: "/dashboard/payments",
        icon: WalletCards,
      },
      {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: CircleDollarSign,
      },
      {
        title: "Wallet",
        href: "/dashboard/wallet",
        icon: WalletCards,
      },
      {
        title: "Audit Trail",
        href: "/dashboard/audit",
        icon: ClipboardList,
      },
      {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
      },
    ],
  },
],

  facility_manager: [
    {
      title: "Operations",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Complaints",
          href: "/dashboard/complaints",
          icon: MessageSquareWarning,
        },
        {
          title: "Maintenance",
          href: "/dashboard/maintenance",
          icon: Wrench,
        },
        {
          title: "Technicians",
          href: "/dashboard/technicians",
          icon: UserRoundCog,
        },
        {
          title: "Schedule",
          href: "/dashboard/schedule",
          icon: CalendarDays,
        },
        {
          title: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
      ],
    },
  ],

  security_staff: [
    {
      title: "",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Visitors",
          href: "/dashboard/visitors",
          icon: Users,
        },
        {
          title: "Delivery & Parcels",
          href: "/dashboard/deliveries",
          icon: Package,
        },
        {
          title: "Parking Slots",
          href: "/dashboard/parking",
          icon: Car,
        },
        {
          title: "Emergency / SOS Alerts",
          href: "/dashboard/alerts",
          icon: MessageSquareWarning,
        },
        {
          title: "Residents Directory",
          href: "/dashboard/residents",
          icon: UserRound,
        },
      ],
    },
  ],

  maintenance_technician: [
    {
      title: "Work",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Assigned Jobs",
          href: "/dashboard/jobs",
          icon: Wrench,
        },
        {
          title: "Completed Jobs",
          href: "/dashboard/completed",
          icon: ClipboardList,
        },
        {
          title: "Schedule",
          href: "/dashboard/schedule",
          icon: CalendarDays,
        },
      ],
    },
  ],

  resident: [
    {
      title: "My Apartment",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "My Flat",
          href: "/dashboard/my-flat",
          icon: Building2,
        },
        {
          title: "Complaints",
          href: "/dashboard/complaints",
          icon: MessageSquareWarning,
        },
        {
          title: "Bills",
          href: "/dashboard/bills",
          icon: ReceiptText,
        },
        {
          title: "Payments",
          href: "/dashboard/payments",
          icon: WalletCards,
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          title: "Visitors",
          href: "/dashboard/visitors",
          icon: QrCode,
        },
        {
          title: "Parking",
          href: "/dashboard/parking",
          icon: Car,
        },
        {
          title: "Announcements",
          href: "/dashboard/announcements",
          icon: Bell,
        },
        {
          title: "Profile",
          href: "/dashboard/profile",
          icon: UserRound,
        },
      ],
    },
  ],
}

export function normalizeDashboardRole(role?: string | null): DashboardRole {
  const normalizedRole = role
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") as DashboardRole | undefined

  if (normalizedRole && normalizedRole in sidebarNavigation) {
    return normalizedRole
  }

  const compactRole = normalizedRole?.replace(/_/g, "")
  const roleAliases: Record<string, DashboardRole> = {
    superadmin: "super_admin",
    propertwhymanager: "property_manager",
    treasurer: "treasurer",
    facilitymanager: "facility_manager",
    securitystaff: "security_staff",
    maintenancetechnician: "maintenance_technician",
    resident: "resident",
  }

  if (compactRole && compactRole in roleAliases) {
    return roleAliases[compactRole]
  }

  return DEFAULT_DASHBOARD_ROLE
}

export function getDashboardRoleRouteSegment(role: DashboardRole) {
  return dashboardRoleRouteSegments[role]
}

export function getDashboardRoleFromRouteSegment(segment: string) {
  const match = Object.entries(dashboardRoleRouteSegments).find(
    ([, routeSegment]) => routeSegment === segment
  )

  return (match?.[0] as DashboardRole | undefined) ?? null
}

export function getDashboardItemHref(role: DashboardRole, href: string) {
  const rolePath = `/${getDashboardRoleRouteSegment(role)}`

  if (href === "/dashboard") {
    return rolePath
  }

  if (href.startsWith("/dashboard/")) {
    return `${rolePath}${href.slice("/dashboard".length)}`
  }

  return href
}

export function getDashboardNavigationItemByPath(
  role: DashboardRole,
  pathname: string
) {
  for (const section of sidebarNavigation[role]) {
    for (const item of section.items) {
      if (getDashboardItemHref(role, item.href) === pathname) {
        return item
      }
    }
  }

  return null
}
