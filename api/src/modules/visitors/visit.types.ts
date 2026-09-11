import type {
  GuestPass,
  GuestPassStatus,
  IVisitorVisit,
  VisitorEntryType,
} from "./visit.model.js"

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

export type CheckInVisitorInput = {
  apartmentId: string
  userId: string
  visitorPassId?: string
  token?: string
}

export type ManualVisitorEntryInput = {
  apartmentId: string
  userId: string
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
  vehicleType?: string
}

export type CheckoutVisitorInput = {
  apartmentId: string
  userId: string
  visitId: string
}

export type ListVisitsInput = {
  apartmentId: string
  page?: number
  limit?: number
}

export type VisitorRecordStatusFilter =
  | "ALL"
  | "UPCOMING"
  | "ACTIVE"
  | "EXITED"

export type VisitorRecordEntryTypeFilter =
  | "ALL"
  | VisitorEntryType

export type ListVisitorRecordsInput = {
  apartmentId: string
  page?: number
  limit?: number
  status?: VisitorRecordStatusFilter
  entryType?: VisitorRecordEntryTypeFilter
  search?: string
}

export type ObjectIdLike = {
  toString: () => string
}

export type LeanFlat = {
  _id: ObjectIdLike
  flatNumber: string
}

export type LeanGuestPass = GuestPass & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
}

export type LeanVisitorVisit = IVisitorVisit & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
  visitorPassId?: ObjectIdLike | null
}
