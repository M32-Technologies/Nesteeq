import { escapeRegExp } from "../../../utils/regex.js"
import {
  VisitorEntryType,
  VisitorVisitStatus,
} from "./visit.interface.js"

export const manualVisitorDuplicateWindowMs =
  5 * 60 * 1000

const exactTextRegex = (value: string) =>
  new RegExp(`^${escapeRegExp(value.trim())}$`, "i")

const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const buildManualVisitorDuplicateFilter = ({
  apartmentId,
  flatId,
  visitorName,
  visitorPhone,
  vehicleNumber,
  now = new Date(),
}: {
  apartmentId: string
  flatId: string
  visitorName: string
  visitorPhone?: string | null
  vehicleNumber?: string | null
  now?: Date
}) => {
  const phone = normalizeText(visitorPhone)
  const vehicle = normalizeText(vehicleNumber)?.toUpperCase()
  const createdAfter = new Date(
    now.getTime() - manualVisitorDuplicateWindowMs
  )

  const baseFilter: Record<string, unknown> = {
    apartmentId,
    flatId,
    entryType: VisitorEntryType.MANUAL,
  }

  if (phone || vehicle) {
    return {
      ...baseFilter,
      $and: [
        {
          $or: [
            { status: VisitorVisitStatus.ACTIVE },
            { createdAt: { $gte: createdAfter } },
          ],
        },
        {
          $or: [
            ...(phone ? [{ visitorPhone: phone }] : []),
            ...(vehicle ? [{ vehicleNumber: vehicle }] : []),
          ],
        },
      ],
    }
  }

  return {
    ...baseFilter,
    visitorName: exactTextRegex(visitorName),
    createdAt: {
      $gte: createdAfter,
    },
  }
}
