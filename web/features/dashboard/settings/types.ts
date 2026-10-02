export type SettingsTab = "profile" | "apartment" | "subscription"

// Known flat mapping for ObjectId to human-readable names
export const KNOWN_FLATS: Record<string, string> = {
  "6a9faa94fec9af4da9060f05": "B-101",
  "6a9faa94fec9af4da9060f06": "B-102",
  "6a9faa94fec9af4da9060f07": "B-103",
  "6a9faa94fec9af4da9060f08": "B-201",
  "6a9faa94fec9af4da9060f09": "B-202",
  "6aa24b1608717e7a1253b0fa": "B-104",
  "6aa274afdeb7436980737d07": "B-203",
}

export function resolveFlatName(val?: string | null): string {
  if (!val) return ""
  if (KNOWN_FLATS[val]) return KNOWN_FLATS[val]
  if (/^[0-9a-fA-F]{24}$/.test(val)) return `Flat ${val.slice(-4).toUpperCase()}`
  return val
}

export type ApartmentData = {
  _id?: string
  id?: string
  name?: string
  address?: string
  city?: string
  state?: string
  totalUnits?: string | number
  totalFloors?: string | number
  totalBlocks?: string | number
  parkingSlots?: string | number
  contactNumber?: string
  emergencyContact?: string
  status?: string
  managerId?: string
  createdAt?: string
  updatedAt?: string
}

export type SubscriptionPlanItem = {
  _id?: string
  id?: string
  planName: string
  price: number
  planType: "MONTHLY" | "SIX_MONTHS" | "YEARLY" | string
  durationMonths: number
  features?: string[]
  freeTrial?: {
    enabled?: boolean
    days?: number
  }
  razorpayPlanId?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type SubscriptionData = {
  _id?: string
  status?: string
  razorpaySubscriptionId?: string
  totalCount?: number
  paidCount?: number
  remainingCount?: number
  isTrial?: boolean
  trialEndsAt?: string
  planSnapshot?: {
    planName?: string
    price?: number
    planType?: string
    durationMonths?: number
    currency?: string
  }
  createdAt?: string
}
