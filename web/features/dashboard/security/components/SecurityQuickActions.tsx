"use client"

import { useRouter } from "next/navigation"
import {
  Car,
  Package,
  QrCode,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react"

const actions = [
  {
    title: "Scan Visitor QR",
    description: "Verify a visitor pass and check in",
    href: "/security/visitors",
    icon: QrCode,
  },
  {
    title: "Register Visitor Manually",
    description: "Add a visitor without a QR pass",
    href: "/security/visitors?mode=manual",
    icon: UserPlus,
  },
  {
    title: "Delivery & Parcels",
    description: "Record arrivals and update collection status",
    href: "/security/deliveries",
    icon: Package,
  },
  {
    title: "Parking Slots",
    description: "Assign or release visitor parking",
    href: "/security/parking",
    icon: Car,
  },
  {
    title: "Emergency / SOS Alerts",
    description: "Acknowledge, respond, and resolve alerts",
    href: "/security/alerts",
    icon: ShieldAlert,
  },
  {
    title: "Residents Directory",
    description: "Find resident and flat contact details",
    href: "/security/residents",
    icon: Users,
  },
]

export function SecurityQuickActions() {
  const router = useRouter()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon

        return (
          <button
            key={action.href}
            type="button"
            onClick={() => router.push(action.href)}
            className="flex min-h-28 w-full items-center justify-start gap-4 rounded-lg border border-[#DDE3DF] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8F5]"
          >
            <Icon className="h-6 w-6 shrink-0 text-[#07584F]" />

            <div>
              <p className="font-semibold text-[#111111]">
                {action.title}
              </p>
              <p className="mt-1 text-sm text-[#637083]">
                {action.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
