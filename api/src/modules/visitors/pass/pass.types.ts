import type { GuestPassStatus } from "./pass.model.js"

export type CreateGuestPassInput = {
  userId: string
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
  validFrom: Date
  validUntil: Date
}

export type ListGuestPassesInput = {
  userId: string
  page?: number
  limit?: number
  status?: GuestPassStatus
}

export type GuestPassByIdInput = {
  userId: string
  guestPassId: string
}

export type CancelGuestPassInput = {
  userId: string
  guestPassId: string
}
