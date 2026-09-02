import type { Types } from "mongoose"

export const VisitorVisitStatus = {
  ACTIVE: "ACTIVE",
  CHECKED_OUT: "CHECKED_OUT",
} as const

export type VisitorVisitStatus =
  (typeof VisitorVisitStatus)[keyof typeof VisitorVisitStatus]

export const VisitorEntryType = {
  PASS: "PASS",
  MANUAL: "MANUAL",
} as const

export type VisitorEntryType =
  (typeof VisitorEntryType)[keyof typeof VisitorEntryType]

export interface IVisitorVisit {
  apartmentId: Types.ObjectId
  flatId: Types.ObjectId

  visitorPassId?: Types.ObjectId | null

  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null

  entryType: VisitorEntryType

  checkedInBy: string
  checkedInAt: Date

  checkedOutBy?: string | null
  checkedOutAt?: Date | null

  status: VisitorVisitStatus

  createdAt?: Date
  updatedAt?: Date
}