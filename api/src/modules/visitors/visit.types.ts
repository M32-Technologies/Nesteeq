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

export type VisitorRecordParkingFields = {
  parkingAssignmentId?: string | null
  parkingSlotId?: string | null
  parkingSlotNumber?: string | null
  parkingAssignmentStatus?: string | null
  parkingAssignedAt?: Date | null
  parkingReleasedAt?: Date | null
  parkingVehicleNumber?: string | null
  parkingVehicleType?: string | null
}

export type VisitorVisitListItem = {
  _id: string
  apartmentId: string
  flatId?: string
  flatNumber: string | null
  visitorPassId?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: string
  checkedInBy: string
  checkedInAt: Date
  checkedOutBy?: string | null
  checkedOutAt?: Date | null
  status: string
  createdAt?: Date
  updatedAt?: Date
}

export type VisitorVisitFacetResult = {
  data: VisitorVisitListItem[]
  totalCount: Array<{
    count: number
  }>
}

export type VisitorRecordItem = {
  _id: string
  source: "PASS" | "VISIT"
  status: "UPCOMING" | "ACTIVE" | "EXITED"
  visitId: string | null
  visitorPassId: string | null
  apartmentId: string
  flatId: string | null
  flatNumber: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: "PASS" | "MANUAL"
  expectedAt?: Date | null
  validUntil?: Date | null
  checkedInAt?: Date | null
  checkedOutAt?: Date | null
} & VisitorRecordParkingFields

export type VisitorRecordsFacetResult = {
  records: VisitorRecordItem[]
  totalCount: Array<{
    count: number
  }>
}

export type ReleasedParkingAssignment = {
  assignmentId: string
  slotId: string
}

