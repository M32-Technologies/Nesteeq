import mongoose, { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { getAuthDB } from "../../config/auth-db.js"
import { Complaint } from "../complaint/complaint.model.js"
import { Maintenance } from "../maintenance/maintenance.model.js"
import { Technician } from "../technician/technician.model.js"
import { Staff } from "../staff/staff.model.js"
import { Flat } from "../flat/flat.model.js"
import { Block } from "../block/block.model.js"
import { Apartment } from "../apartment/apartment.model.js"

export type AssignedJob = {
  _id?: string
  jobId: string
  title: string
  issueDetails?: string
  category: string
  block: string
  flat: string
  priority: "High" | "Medium" | "Low"
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  assignedDate: string
  createdAt?: string
  type?: "MAINTENANCE" | "COMPLAINT" | string
  jobType?: "MAINTENANCE" | "COMPLAINT"
  location?: string
  area?: string
  flatNumber?: string
  unitNumber?: string
  blockName?: string
}

export type JobDetails = {
  jobId: string
  complaintInfo: {
    title: string
    description: string
    category: string
    priority: "High" | "Medium" | "Low"
    status: string
    createdAt: string
    complaintImage?: string
    complaintImages?: string[]
  }
  locationInfo: {
    block: string
    flat: string
    floor: string
  }
  residentInfo: {
    name: string
    residentType: string
    contactNumber: string
  }
  assignmentInfo: {
    assignedBy: string
    assignedDate: string
    currentStatus: string
  }
  expenseInfo?: {
    expenseAmount?: number
    expenseDescription?: string
    expenseReceiptUrl?: string | null
    expenseStatus?: "PENDING_FACILITY_APPROVAL" | "APPROVED" | "REJECTED" | string
    expenseSubmittedAt?: string
    expenseRejectionReason?: string
  }
}

const mapPriority = (rawPriority?: string | null): "High" | "Medium" | "Low" => {
  const p = (rawPriority || "").toUpperCase()
  if (p === "HIGH" || p === "URGENT") return "High"
  if (p === "LOW") return "Low"
  return "Medium"
}

const mapStatus = (
  rawStatus?: string | null
): "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" => {
  const s = (rawStatus || "").toUpperCase()
  if (
    [
      "COMPLETED",
      "WORK_COMPLETED",
      "AWAITING_APPROVAL",
      "APPROVED",
      "CLOSED",
      "RESOLVED",
    ].includes(s)
  ) {
    return "COMPLETED"
  }
  if (["IN_PROGRESS", "ON_HOLD"].includes(s)) {
    return "IN_PROGRESS"
  }
  return "ASSIGNED"
}

const deriveFloor = (flat?: string | null): string => {
  if (!flat) return "1st Floor"
  const match = flat.match(/\d+/)
  if (!match) return "1st Floor"
  const num = parseInt(match[0], 10)
  const floorNum = num >= 100 ? Math.floor(num / 100) : num
  if (floorNum === 0) return "Ground Floor"
  if (floorNum === 1) return "1st Floor"
  if (floorNum === 2) return "2nd Floor"
  if (floorNum === 3) return "3rd Floor"
  return `${floorNum}th Floor`
}

const isHexObjectId = (val: unknown): boolean => {
  if (typeof val !== "string") return false
  return /^[0-9a-fA-F]{24}$/.test(val.trim())
}

const extractObjectId = (val: unknown): string | null => {
  if (!val) return null
  if (typeof val === "string" && isHexObjectId(val)) return val.trim()
  if (typeof val === "object" && val !== null) {
    if ("_id" in val && isHexObjectId(String((val as any)._id))) {
      return String((val as any)._id).trim()
    }
    const str = String(val)
    if (isHexObjectId(str)) return str.trim()
  }
  return null
}

const resolveDocLocation = (
  doc: any,
  flatMap: Map<string, any>,
  blockMap: Map<string, any>,
  apartmentMap: Map<string, any>
) => {
  const flatCandidateId =
    extractObjectId(doc.flatId) ||
    extractObjectId(doc.flat) ||
    (doc.complaint
      ? extractObjectId(doc.complaint.flatId) || extractObjectId(doc.complaint.flat)
      : null)

  const resolvedFlatDoc = flatCandidateId ? flatMap.get(flatCandidateId) : null

  let flatNumber: string | null = null
  if (resolvedFlatDoc?.flatNumber) {
    flatNumber = String(resolvedFlatDoc.flatNumber).trim()
  } else if (doc.flatNumber && !isHexObjectId(doc.flatNumber)) {
    flatNumber = String(doc.flatNumber).trim()
  } else if (doc.unitNumber && !isHexObjectId(doc.unitNumber)) {
    flatNumber = String(doc.unitNumber).trim()
  } else if (typeof doc.flat === "string" && !isHexObjectId(doc.flat) && doc.flat.trim() !== "") {
    flatNumber = doc.flat.trim()
  } else if (typeof doc.flat === "object" && doc.flat !== null) {
    const num = doc.flat.number || doc.flat.flatNumber
    if (num && !isHexObjectId(num)) flatNumber = String(num).trim()
  } else if (doc.complaint) {
    if (typeof doc.complaint.flat === "string" && !isHexObjectId(doc.complaint.flat)) {
      flatNumber = doc.complaint.flat.trim()
    } else if (typeof doc.complaint.flat === "object" && doc.complaint.flat !== null) {
      const num = doc.complaint.flat.number || doc.complaint.flat.flatNumber
      if (num && !isHexObjectId(num)) flatNumber = String(num).trim()
    }
  }

  let blockName: string | null = null
  let apartmentName: string | null = null

  if (resolvedFlatDoc?.blockId) {
    const b = blockMap.get(resolvedFlatDoc.blockId.toString())
    if (b) {
      blockName = b.blockname || b.code || null
    }
  }

  if (resolvedFlatDoc?.apartmentId) {
    const a = apartmentMap.get(resolvedFlatDoc.apartmentId.toString())
    if (a?.name) {
      apartmentName = a.name
    }
  }

  const aptCandidateId =
    extractObjectId(doc.apartmentId) ||
    extractObjectId(doc.apartment) ||
    (doc.complaint
      ? extractObjectId(doc.complaint.apartmentId) || extractObjectId(doc.complaint.apartment)
      : null)

  if (aptCandidateId && !apartmentName) {
    const a = apartmentMap.get(aptCandidateId)
    if (a?.name) {
      apartmentName = a.name
    }
  }

  if (!apartmentName) {
    if (typeof doc.apartment === "string" && !isHexObjectId(doc.apartment) && doc.apartment.trim() !== "") {
      apartmentName = doc.apartment.trim()
    } else if (typeof doc.apartment === "object" && doc.apartment?.name) {
      apartmentName = String(doc.apartment.name).trim()
    } else if (doc.complaint) {
      if (typeof doc.complaint.apartment === "string" && !isHexObjectId(doc.complaint.apartment)) {
        apartmentName = doc.complaint.apartment.trim()
      } else if (typeof doc.complaint.apartment === "object" && doc.complaint.apartment?.name) {
        apartmentName = String(doc.complaint.apartment.name).trim()
      }
    }
  }

  let locationText: string | null = null
  const rawLoc = doc.location || doc.complaint?.location
  const rawArea = doc.area || doc.complaint?.area

  if (typeof rawLoc === "string" && !isHexObjectId(rawLoc) && rawLoc.trim() !== "") {
    locationText = rawLoc.trim()
  } else if (typeof rawArea === "string" && !isHexObjectId(rawArea) && rawArea.trim() !== "") {
    locationText = rawArea.trim()
  }

  const resolvedBlock = blockName || apartmentName || "Apartment"
  const resolvedFlat = flatNumber || locationText || "Unit"

  let floorStr = "1st Floor"
  if (resolvedFlatDoc?.floorNumber != null) {
    const fNum = Number(resolvedFlatDoc.floorNumber)
    if (fNum === 0) floorStr = "Ground Floor"
    else if (fNum === 1) floorStr = "1st Floor"
    else if (fNum === 2) floorStr = "2nd Floor"
    else if (fNum === 3) floorStr = "3rd Floor"
    else floorStr = `${fNum}th Floor`
  } else {
    floorStr = deriveFloor(resolvedFlat)
  }

  return {
    flatNumber: flatNumber || undefined,
    unitNumber: flatNumber || undefined,
    blockName: blockName || apartmentName || undefined,
    location: locationText || undefined,
    area: typeof rawArea === "string" && !isHexObjectId(rawArea) ? rawArea.trim() : undefined,
    displayFlat: resolvedFlat,
    displayBlock: resolvedBlock,
    floor: floorStr,
  }
}

const resolveSingleDocLocation = async (doc: any) => {
  const flatIdSet = new Set<string>()
  const apartmentIdSet = new Set<string>()
  const blockIdSet = new Set<string>()

  const fId =
    extractObjectId(doc.flatId) ||
    extractObjectId(doc.flat) ||
    (doc.complaint
      ? extractObjectId(doc.complaint.flatId) || extractObjectId(doc.complaint.flat)
      : null)
  if (fId) flatIdSet.add(fId)

  const aId =
    extractObjectId(doc.apartmentId) ||
    extractObjectId(doc.apartment) ||
    (doc.complaint
      ? extractObjectId(doc.complaint.apartmentId) || extractObjectId(doc.complaint.apartment)
      : null)
  if (aId) apartmentIdSet.add(aId)

  const flatDocs =
    flatIdSet.size > 0
      ? await Flat.find({
          _id: { $in: Array.from(flatIdSet).map((id) => new Types.ObjectId(id)) },
        })
          .select("_id flatNumber floorNumber blockId apartmentId")
          .lean()
      : []

  const flatMap = new Map<string, any>()
  for (const f of flatDocs as any[]) {
    flatMap.set(f._id.toString(), f)
    if (f.blockId) blockIdSet.add(f.blockId.toString())
    if (f.apartmentId) apartmentIdSet.add(f.apartmentId.toString())
  }

  const [blockDocs, aptDocs] = await Promise.all([
    blockIdSet.size > 0
      ? Block.find({
          _id: { $in: Array.from(blockIdSet).map((id) => new Types.ObjectId(id)) },
        })
          .select("_id blockname code")
          .lean()
      : [],
    apartmentIdSet.size > 0
      ? Apartment.find({
          _id: { $in: Array.from(apartmentIdSet).map((id) => new Types.ObjectId(id)) },
        })
          .select("_id name")
          .lean()
      : [],
  ])

  const blockMap = new Map<string, any>()
  for (const b of blockDocs as any[]) {
    blockMap.set(b._id.toString(), b)
  }

  const apartmentMap = new Map<string, any>()
  for (const a of aptDocs as any[]) {
    apartmentMap.set(a._id.toString(), a)
  }

  return resolveDocLocation(doc, flatMap, blockMap, apartmentMap)
}

export const resolveTechnicianIds = async (
  technicianUserId: string,
  extraTechnicianId?: string | null
): Promise<string[]> => {
  const ids = new Set<string>()
  if (!technicianUserId && !extraTechnicianId) return []

  if (technicianUserId) {
    const trimmed = technicianUserId.toString().trim()
    if (trimmed) ids.add(trimmed)
  }
  if (extraTechnicianId) {
    const trimmedExtra = extraTechnicianId.toString().trim()
    if (trimmedExtra) ids.add(trimmedExtra)
  }

  const searchIds = Array.from(ids)
  for (const trimmed of searchIds) {
    try {
      const objectIdCondition = Types.ObjectId.isValid(trimmed)
        ? [{ _id: new Types.ObjectId(trimmed) }]
        : []

      // 1. Check Better Auth user record if available to get linked email / alternative id
      let userEmail: string | null = null
      try {
        const authUser = await getAuthDB()
          .collection("user")
          .findOne({
            $or: [
              { id: trimmed },
              ...(Types.ObjectId.isValid(trimmed)
                ? [{ _id: new Types.ObjectId(trimmed) }]
                : []),
            ],
          })
        if (authUser) {
          if (authUser.id) ids.add(authUser.id.toString())
          if (authUser._id) ids.add(authUser._id.toString())
          if (authUser.email) userEmail = authUser.email.toString().toLowerCase()
        }
      } catch {
        // ignore auth DB lookup failure if standalone
      }

      const techQueryOr: Record<string, unknown>[] = [
        { userId: trimmed },
        { id: trimmed },
        ...objectIdCondition,
      ]
      if (userEmail) {
        techQueryOr.push({ email: userEmail })
      }

      const [techDocs, staffDocs] = await Promise.all([
        Technician.find({ $or: techQueryOr })
          .select("_id userId id")
          .lean(),
        Staff.find({
          $or: [
            { userId: trimmed },
            ...objectIdCondition,
          ],
        })
          .select("_id userId")
          .lean(),
      ])

      for (const tech of techDocs as any[]) {
        if (tech._id) ids.add(tech._id.toString())
        if (tech.userId) ids.add(tech.userId.toString())
        if (tech.id) ids.add(tech.id.toString())
      }

      for (const staff of staffDocs as any[]) {
        if (staff._id) ids.add(staff._id.toString())
        if (staff.userId) ids.add(staff.userId.toString())
      }
    } catch (err) {
      console.error("Error resolving technician IDs:", err)
    }
  }

  return Array.from(ids)
}

export const buildTechnicianScope = (ids: string[]): Record<string, unknown> => {
  if (!ids || ids.length === 0) return { _id: null }

  const objectIds = ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id))

  const allPossibleIdValues = [...ids, ...objectIds]

  return {
    $or: [
      { assignedStaff: { $in: allPossibleIdValues } },
      { assignedStaffId: { $in: allPossibleIdValues } },
      { assignedTo: { $in: allPossibleIdValues } },
      { "assignedTo._id": { $in: allPossibleIdValues } },
      { "assignedTo.id": { $in: ids } },
      { "assignedTo.userId": { $in: ids } },
      { assignedTechnicianId: { $in: allPossibleIdValues } },
      { technician: { $in: allPossibleIdValues } },
      { technicianId: { $in: allPossibleIdValues } },
      { "technician._id": { $in: allPossibleIdValues } },
      { "technician.id": { $in: ids } },
      { "technician.userId": { $in: ids } },
    ],
  }
}

const buildJobLookupFilter = (
  jobId: string,
  ids: string[]
): Record<string, unknown> => {
  const idCondition = Types.ObjectId.isValid(jobId)
    ? { $or: [{ _id: new Types.ObjectId(jobId) }, { _id: jobId }, { jobId }] }
    : { $or: [{ _id: jobId }, { jobId }] }

  return {
    $and: [idCondition, buildTechnicianScope(ids)],
  }
}

export const getDashboardStats = async (
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  const allJobs = await getAssignedJobs("ALL", technicianUserId, extraTechnicianId)

  let pending = 0
  let inProgress = 0
  let completed = 0

  for (const job of allJobs) {
    if (job.status === "COMPLETED") {
      completed++
    } else if (job.status === "IN_PROGRESS") {
      inProgress++
    } else {
      pending++
    }
  }

  return {
    stats: {
      totalAssigned: allJobs.length,
      pending,
      inProgress,
      completed,
    },
  }
}

export const getAssignedJobs = async (
  status: string | undefined,
  technicianUserId: string,
  extraTechnicianId?: string | null,
  sortBy: string = "createdAt",
  order: string = "desc"
): Promise<AssignedJob[]> => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const scopeFilter = buildTechnicianScope(ids)

  const complaintFilter: Record<string, any> = { ...scopeFilter }
  const maintenanceFilter: Record<string, any> = { ...scopeFilter }

  if (status && status !== "ALL") {
    const s = status.toUpperCase()
    if (s === "ACTIVE") {
      complaintFilter.status = {
        $in: [
          "PENDING",
          "UNDER_REVIEW",
          "ASSIGNED",
          "IN_PROGRESS",
          "pending",
          "under_review",
          "assigned",
          "in_progress",
        ],
      }
      maintenanceFilter.status = {
        $in: [
          "SCHEDULED",
          "PENDING",
          "ASSIGNED",
          "IN_PROGRESS",
          "ON_HOLD",
          "scheduled",
          "pending",
          "assigned",
          "in_progress",
          "on_hold",
          "Active",
          "ACTIVE",
          "Assigned",
        ],
      }
    } else if (s === "COMPLETED" || s === "WORK_COMPLETED") {
      complaintFilter.status = {
        $in: [
          "WORK_COMPLETED",
          "AWAITING_APPROVAL",
          "APPROVED",
          "CLOSED",
          "RESOLVED",
        ],
      }
      maintenanceFilter.status = {
        $in: [
          "COMPLETED",
          "WORK_COMPLETED",
          "AWAITING_APPROVAL",
          "APPROVED",
          "CLOSED",
        ],
      }
    } else if (s === "ASSIGNED" || s === "PENDING" || s === "SCHEDULED") {
      complaintFilter.status = {
        $in: [
          "PENDING",
          "UNDER_REVIEW",
          "ASSIGNED",
          "pending",
          "under_review",
          "assigned",
        ],
      }
      maintenanceFilter.status = {
        $in: [
          "SCHEDULED",
          "PENDING",
          "ASSIGNED",
          "scheduled",
          "pending",
          "assigned",
          "Assigned",
        ],
      }
    } else if (s === "IN_PROGRESS") {
      complaintFilter.status = { $in: ["IN_PROGRESS", "in_progress"] }
      maintenanceFilter.status = {
        $in: ["IN_PROGRESS", "ON_HOLD", "in_progress", "on_hold"],
      }
    } else {
      complaintFilter.status = s
      maintenanceFilter.status = s
    }
  } else {
    complaintFilter.status = {
      $nin: ["CANCELLED", "cancelled", "REJECTED", "rejected"],
    }
    maintenanceFilter.status = {
      $nin: ["CANCELLED", "cancelled", "REJECTED", "rejected"],
    }
  }

  const [complaintDocs, maintenanceDocs] = await Promise.all([
    Complaint.find(complaintFilter).sort({ createdAt: -1 }).lean(),
    Maintenance.find(maintenanceFilter)
      .populate("complaint")
      .sort({ createdAt: -1 })
      .lean(),
  ])

  const flatIdSet = new Set<string>()
  const apartmentIdSet = new Set<string>()
  const blockIdSet = new Set<string>()

  for (const doc of complaintDocs as any[]) {
    const fId = extractObjectId(doc.flatId) || extractObjectId(doc.flat)
    if (fId) flatIdSet.add(fId)
    const aId =
      extractObjectId(doc.apartmentId) || extractObjectId(doc.apartment)
    if (aId) apartmentIdSet.add(aId)
  }

  for (const doc of maintenanceDocs as any[]) {
    const fId =
      extractObjectId(doc.flat) ||
      extractObjectId(doc.complaint?.flatId) ||
      extractObjectId(doc.complaint?.flat)
    if (fId) flatIdSet.add(fId)
    const aId =
      extractObjectId(doc.apartment) ||
      extractObjectId(doc.complaint?.apartmentId) ||
      extractObjectId(doc.complaint?.apartment)
    if (aId) apartmentIdSet.add(aId)
  }

  const flatDocs =
    flatIdSet.size > 0
      ? await Flat.find({
          _id: {
            $in: Array.from(flatIdSet).map((id) => new Types.ObjectId(id)),
          },
        })
          .select("_id flatNumber floorNumber blockId apartmentId")
          .lean()
      : []

  const flatMap = new Map<string, any>()
  for (const f of flatDocs as any[]) {
    flatMap.set(f._id.toString(), f)
    if (f.blockId) blockIdSet.add(f.blockId.toString())
    if (f.apartmentId) apartmentIdSet.add(f.apartmentId.toString())
  }

  const [blockDocs, aptDocs] = await Promise.all([
    blockIdSet.size > 0
      ? Block.find({
          _id: {
            $in: Array.from(blockIdSet).map((id) => new Types.ObjectId(id)),
          },
        })
          .select("_id blockname code")
          .lean()
      : [],
    apartmentIdSet.size > 0
      ? Apartment.find({
          _id: {
            $in: Array.from(apartmentIdSet).map((id) => new Types.ObjectId(id)),
          },
        })
          .select("_id name")
          .lean()
      : [],
  ])

  const blockMap = new Map<string, any>()
  for (const b of blockDocs as any[]) {
    blockMap.set(b._id.toString(), b)
  }

  const apartmentMap = new Map<string, any>()
  for (const a of aptDocs as any[]) {
    apartmentMap.set(a._id.toString(), a)
  }

  const jobs: AssignedJob[] = []
  const seenComplaintIds = new Set<string>()

  for (const doc of complaintDocs as any[]) {
    const idStr = doc._id.toString()
    seenComplaintIds.add(idStr)
    const rawDateVal = doc.assignedAt || doc.createdAt || new Date()
    const assignedDate = new Date(rawDateVal).toISOString()
    const createdAtStr = doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date(rawDateVal).toISOString()

    const loc = resolveDocLocation(doc, flatMap, blockMap, apartmentMap)

    jobs.push({
      _id: idStr,
      jobId: idStr,
      title: doc.title || "Complaint Request",
      issueDetails: doc.title || doc.description || "Complaint Request",
      category: doc.category || "General Maintenance",
      block: loc.displayBlock,
      flat: loc.displayFlat,
      priority: mapPriority(doc.priority),
      status: mapStatus(doc.status),
      assignedDate,
      createdAt: createdAtStr,
      type: "COMPLAINT",
      jobType: "COMPLAINT",
      flatNumber: loc.flatNumber,
      unitNumber: loc.unitNumber,
      blockName: loc.blockName,
      location: loc.location,
      area: loc.area,
    })
  }

  for (const doc of maintenanceDocs as any[]) {
    const linkedComplaintId = doc.complaint?._id
      ? doc.complaint._id.toString()
      : doc.complaint?.toString()
    if (linkedComplaintId && seenComplaintIds.has(linkedComplaintId)) {
      continue
    }

    const idStr = doc._id.toString()
    const rawDateVal = doc.assignedAt || doc.createdAt || new Date()
    const assignedDate = new Date(rawDateVal).toISOString()
    const createdAtStr = doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date(rawDateVal).toISOString()

    const loc = resolveDocLocation(doc, flatMap, blockMap, apartmentMap)

    const locationText =
      typeof doc.location === "string" &&
      doc.location.trim() !== "" &&
      !isHexObjectId(doc.location)
        ? doc.location.trim()
        : loc.location || "Building Common Area"

    const titleText = doc.title || doc.type || "Routine Maintenance"

    jobs.push({
      _id: idStr,
      jobId: idStr,
      title: titleText,
      issueDetails: titleText,
      category: doc.type || doc.category || "MAINTENANCE",
      block: loc.displayBlock || "Building",
      flat:
        loc.displayFlat && loc.displayFlat !== "Unit"
          ? loc.displayFlat
          : locationText,
      priority: mapPriority(doc.priority),
      status: mapStatus(doc.status),
      assignedDate,
      createdAt: createdAtStr,
      type: "MAINTENANCE",
      jobType: "MAINTENANCE",
      flatNumber: loc.flatNumber,
      unitNumber: loc.unitNumber,
      blockName: loc.blockName,
      location: locationText,
      area: loc.area,
    })
  }

  const isAsc = String(order || "desc").toLowerCase() === "asc"
  jobs.sort((a, b) => {
    const dateFieldA =
      sortBy === "assignedDate"
        ? a.assignedDate || a.createdAt
        : a.createdAt || a.assignedDate
    const dateFieldB =
      sortBy === "assignedDate"
        ? b.assignedDate || b.createdAt
        : b.createdAt || b.assignedDate
    const timeA = new Date(dateFieldA || 0).getTime()
    const timeB = new Date(dateFieldB || 0).getTime()
    return isAsc ? timeA - timeB : timeB - timeA
  })

  return jobs
}

export const getJobById = async (
  jobId: string,
  technicianUserId: string,
  extraTechnicianId?: string | null
): Promise<JobDetails> => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)

  // First try Maintenance collection
  const maintDoc: any = await Maintenance.findOne(query)
    .populate("complaint")
    .lean()

  if (maintDoc) {
    const assignedDateVal =
      maintDoc.assignedAt || maintDoc.createdAt || new Date()
    const createdDateVal = maintDoc.createdAt || new Date()
    const mappedStatus = mapStatus(maintDoc.status)
    const mappedPriority = mapPriority(maintDoc.priority)
    const complaintObj =
      maintDoc.complaint && typeof maintDoc.complaint === "object"
        ? maintDoc.complaint
        : null

    const loc = await resolveSingleDocLocation(maintDoc)

    const expenseAmountVal =
      maintDoc.expenseAmount != null
        ? maintDoc.expenseAmount
        : complaintObj?.expenseAmount != null
        ? complaintObj.expenseAmount
        : maintDoc.costReview?.submittedAmount != null
        ? maintDoc.costReview.submittedAmount
        : null

    const expenseDescVal =
      maintDoc.expenseDescription ??
      complaintObj?.expenseDescription ??
      maintDoc.costReview?.remarks ??
      null

    const expenseReceiptVal =
      maintDoc.expenseReceiptUrl ??
      complaintObj?.expenseReceiptUrl ??
      null

    const expenseStatusVal =
      maintDoc.expenseStatus ??
      complaintObj?.expenseStatus ??
      (maintDoc.costReview?.status === "SUBMITTED"
        ? "PENDING_FACILITY_APPROVAL"
        : maintDoc.costReview?.status) ??
      null

    const expenseSubmittedAtVal =
      maintDoc.expenseSubmittedAt ||
      complaintObj?.expenseSubmittedAt ||
      maintDoc.costReview?.submittedAt ||
      null

    const expenseRejectionReasonVal =
      maintDoc.expenseRejectionReason ||
      complaintObj?.expenseRejectionReason ||
      null

    const expenseInfo =
      expenseAmountVal != null
        ? {
            expenseAmount: Number(expenseAmountVal),
            expenseDescription: expenseDescVal || "",
            expenseReceiptUrl: expenseReceiptVal || null,
            expenseStatus: expenseStatusVal || "PENDING_FACILITY_APPROVAL",
            expenseSubmittedAt: expenseSubmittedAtVal
              ? new Date(expenseSubmittedAtVal).toISOString()
              : undefined,
            expenseRejectionReason: expenseRejectionReasonVal || undefined,
          }
        : undefined

    return {
      jobId: maintDoc._id.toString(),
      complaintInfo: {
        title: maintDoc.title || "Maintenance Request",
        description:
          maintDoc.description ||
          "General maintenance and inspection required for this unit.",
        category: maintDoc.category || "General Maintenance",
        priority: mappedPriority,
        status: mappedStatus,
        createdAt: new Date(createdDateVal).toISOString(),
        complaintImage:
          complaintObj?.image ||
          maintDoc.image ||
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      },
      locationInfo: {
        block: loc.displayBlock,
        flat: loc.displayFlat,
        floor: loc.floor,
      },
      residentInfo: {
        name:
          typeof maintDoc.resident === "object"
            ? maintDoc.resident?.name || "Resident"
            : (!isHexObjectId(maintDoc.resident) && maintDoc.resident) ||
              complaintObj?.resident ||
              "Resident",
        residentType: "Resident",
        contactNumber: complaintObj?.phone || "+91 98000 00000",
      },
      assignmentInfo: {
        assignedBy: maintDoc.assignedBy || "Facility Manager",
        assignedDate: new Date(assignedDateVal).toISOString(),
        currentStatus: mappedStatus,
      },
      expenseInfo,
    }
  }

  // Next try Complaint collection
  const complaintDoc: any = await Complaint.findOne(query).lean()

  if (complaintDoc) {
    const assignedDateVal =
      complaintDoc.assignedAt || complaintDoc.createdAt || new Date()
    const createdDateVal = complaintDoc.createdAt || new Date()
    const mappedStatus = mapStatus(complaintDoc.status)
    const mappedPriority = mapPriority(complaintDoc.priority)

    const loc = await resolveSingleDocLocation(complaintDoc)

    const expenseAmountVal =
      complaintDoc.expenseAmount != null ? complaintDoc.expenseAmount : null

    const expenseInfo =
      expenseAmountVal != null
        ? {
            expenseAmount: Number(expenseAmountVal),
            expenseDescription: complaintDoc.expenseDescription || "",
            expenseReceiptUrl: complaintDoc.expenseReceiptUrl || null,
            expenseStatus:
              complaintDoc.expenseStatus || "PENDING_FACILITY_APPROVAL",
            expenseSubmittedAt: complaintDoc.expenseSubmittedAt
              ? new Date(complaintDoc.expenseSubmittedAt).toISOString()
              : undefined,
            expenseRejectionReason:
              complaintDoc.expenseRejectionReason || undefined,
          }
        : undefined

    return {
      jobId: complaintDoc._id.toString(),
      complaintInfo: {
        title: complaintDoc.title || "Complaint Request",
        description:
          complaintDoc.description ||
          "Complaint request assigned for resolution.",
        category: complaintDoc.category || "General Maintenance",
        priority: mappedPriority,
        status: mappedStatus,
        createdAt: new Date(createdDateVal).toISOString(),
        complaintImage:
          complaintDoc.image ||
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      },
      locationInfo: {
        block: loc.displayBlock,
        flat: loc.displayFlat,
        floor: loc.floor,
      },
      residentInfo: {
        name:
          typeof complaintDoc.resident === "object"
            ? complaintDoc.resident?.name || "Resident"
            : (!isHexObjectId(complaintDoc.resident) && complaintDoc.resident) ||
              "Resident",
        residentType: "Resident",
        contactNumber:
          typeof complaintDoc.resident === "object"
            ? complaintDoc.resident?.phone || "+91 98000 00000"
            : "+91 98000 00000",
      },
      assignmentInfo: {
        assignedBy: complaintDoc.assignedBy || "Facility Manager",
        assignedDate: new Date(assignedDateVal).toISOString(),
        currentStatus: mappedStatus,
      },
      expenseInfo,
    }
  }

  throw new AppError("Maintenance job not found", 404)
}

export const startJob = async (
  jobId: string,
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)
  const now = new Date()

  // Check Maintenance
  const maintJob = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        status: "IN_PROGRESS",
        startedAt: now,
        updatedBy: technicianUserId,
      },
      $push: {
        progressUpdates: {
          details: "Maintenance work started by technician",
          status: "IN_PROGRESS",
          remarks: "Status changed to IN_PROGRESS",
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (maintJob) {
    if (maintJob.complaint) {
      await Complaint.findByIdAndUpdate(maintJob.complaint, {
        $set: { status: "IN_PROGRESS" },
      })
    }
    return {
      success: true,
      status: "IN_PROGRESS",
      startedAt: now.toISOString(),
    }
  }

  // Check Complaint
  const complaintJob = await Complaint.findOneAndUpdate(
    query,
    {
      $set: { status: "IN_PROGRESS" },
      $push: {
        remarks: {
          message: "Work started by technician",
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!complaintJob) {
    throw new AppError("Maintenance job not found", 404)
  }

  return {
    success: true,
    status: "IN_PROGRESS",
    startedAt: now.toISOString(),
  }
}

export const addProgressUpdate = async (
  jobId: string,
  message: string,
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)
  const now = new Date()

  // Check Maintenance
  const maintJob = await Maintenance.findOneAndUpdate(
    query,
    {
      $push: {
        progressUpdates: {
          details: message,
          status: "IN_PROGRESS",
          remarks: message,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
        workNotes: {
          message,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
      $set: {
        updatedBy: technicianUserId,
      },
    },
    { returnDocument: "after" }
  )

  if (maintJob) {
    if (maintJob.complaint) {
      await Complaint.findByIdAndUpdate(maintJob.complaint, {
        $push: {
          remarks: {
            message,
            by: technicianUserId,
            role: "maintenance_technician",
            createdAt: now,
          },
        },
      })
    }
    return {
      success: true,
      message,
      createdAt: now.toISOString(),
    }
  }

  // Check Complaint
  const complaintJob = await Complaint.findOneAndUpdate(
    query,
    {
      $push: {
        remarks: {
          message,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!complaintJob) {
    throw new AppError("Maintenance job not found", 404)
  }

  return {
    success: true,
    message,
    createdAt: now.toISOString(),
  }
}

export const uploadEvidence = async (
  jobId: string,
  file: Express.Multer.File | undefined,
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  if (!file) {
    throw new AppError("Evidence file is required", 400)
  }

  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)
  const filename = file.filename
  const originalname = file.originalname || file.filename
  const fileUrl = `/uploads/${filename}`
  const now = new Date()

  const maintJob = await Maintenance.findOneAndUpdate(
    query,
    {
      $push: {
        workNotes: {
          message: `Evidence uploaded: ${originalname} (${fileUrl})`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
      $set: {
        updatedBy: technicianUserId,
      },
    },
    { returnDocument: "after" }
  )

  if (maintJob) {
    if (maintJob.complaint) {
      await Complaint.findByIdAndUpdate(maintJob.complaint, {
        $push: {
          remarks: {
            message: `Evidence uploaded: ${originalname} (${fileUrl})`,
            by: technicianUserId,
            role: "maintenance_technician",
            createdAt: now,
          },
        },
      })
    }
    return {
      success: true,
      fileUrl,
      fileName: originalname,
    }
  }

  const complaintJob = await Complaint.findOneAndUpdate(
    query,
    {
      $push: {
        remarks: {
          message: `Evidence uploaded: ${originalname} (${fileUrl})`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!complaintJob) {
    throw new AppError("Maintenance job not found", 404)
  }

  return {
    success: true,
    fileUrl,
    fileName: originalname,
  }
}

export const submitCost = async (
  jobId: string,
  amount: number,
  description: string,
  receiptUrl: string | null,
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)
  const now = new Date()
  const numAmount = Number(amount) || 0

  const maintJob = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        finalCost: numAmount,
        costReview: {
          status: "SUBMITTED",
          submittedAmount: numAmount,
          submittedBy: technicianUserId,
          submittedAt: now,
          remarks: description || null,
        },
        expenseAmount: numAmount,
        expenseDescription: description || "",
        expenseReceiptUrl: receiptUrl || null,
        expenseStatus: "PENDING_FACILITY_APPROVAL",
        expenseSubmittedAt: now,
        expenseSubmittedBy: technicianUserId,
        updatedBy: technicianUserId,
      },
      $push: {
        workNotes: {
          message: `Maintenance cost estimate submitted: ₹${numAmount}${
            description ? ` - ${description}` : ""
          }${receiptUrl ? ` (Receipt: ${receiptUrl})` : ""}`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (maintJob) {
    if (maintJob.complaint) {
      await Complaint.findByIdAndUpdate(maintJob.complaint, {
        $set: {
          finalCost: numAmount,
          estimatedCost: numAmount,
          expenseAmount: numAmount,
          expenseDescription: description || "",
          expenseReceiptUrl: receiptUrl || null,
          expenseStatus: "PENDING_FACILITY_APPROVAL",
          expenseSubmittedAt: now,
          expenseSubmittedBy: technicianUserId,
        },
      })
    }
    return {
      success: true,
      amount: numAmount,
      expenseAmount: numAmount,
      description,
      expenseDescription: description,
      receiptUrl,
      expenseReceiptUrl: receiptUrl,
      expenseStatus: "PENDING_FACILITY_APPROVAL",
      submittedAt: now.toISOString(),
    }
  }

  const complaintJob = await Complaint.findOneAndUpdate(
    query,
    {
      $set: {
        finalCost: numAmount,
        estimatedCost: numAmount,
        expenseAmount: numAmount,
        expenseDescription: description || "",
        expenseReceiptUrl: receiptUrl || null,
        expenseStatus: "PENDING_FACILITY_APPROVAL",
        expenseSubmittedAt: now,
        expenseSubmittedBy: technicianUserId,
      },
      $push: {
        remarks: {
          message: `Maintenance cost estimate submitted: ₹${numAmount}${
            description ? ` - ${description}` : ""
          }${receiptUrl ? ` (Receipt: ${receiptUrl})` : ""}`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!complaintJob) {
    throw new AppError("Maintenance job not found", 404)
  }

  await Maintenance.updateMany(
    { complaint: complaintJob._id },
    {
      $set: {
        finalCost: numAmount,
        expenseAmount: numAmount,
        expenseDescription: description || "",
        expenseReceiptUrl: receiptUrl || null,
        expenseStatus: "PENDING_FACILITY_APPROVAL",
        expenseSubmittedAt: now,
        expenseSubmittedBy: technicianUserId,
      },
    }
  )

  return {
    success: true,
    amount: numAmount,
    expenseAmount: numAmount,
    description,
    expenseDescription: description,
    receiptUrl,
    expenseReceiptUrl: receiptUrl,
    expenseStatus: "PENDING_FACILITY_APPROVAL",
    submittedAt: now.toISOString(),
  }
}

export const completeJob = async (
  jobId: string,
  payload: { workSummary: string; notes?: string },
  technicianUserId: string,
  extraTechnicianId?: string | null
) => {
  const ids = await resolveTechnicianIds(technicianUserId, extraTechnicianId)
  const query = buildJobLookupFilter(jobId, ids)
  const now = new Date()

  const maintJob = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        status: "COMPLETED",
        completedAt: now,
        completionDetails: {
          details: payload.workSummary,
          workNotes: payload.notes || null,
          completedBy: technicianUserId,
          completedAt: now,
        },
        updatedBy: technicianUserId,
      },
      $push: {
        progressUpdates: {
          details: `Work completed: ${payload.workSummary}`,
          status: "COMPLETED",
          remarks: payload.notes || null,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
        workNotes: {
          message: `Work completed: ${payload.workSummary}${
            payload.notes ? ` - Notes: ${payload.notes}` : ""
          }`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (maintJob) {
    if (maintJob.complaint) {
      await Complaint.findByIdAndUpdate(maintJob.complaint, {
        $set: {
          status: "WORK_COMPLETED",
          completionDetails: {
            details: payload.workSummary,
            completedBy: technicianUserId,
            completedAt: now,
          },
        },
      })
    }

    return {
      success: true,
      status: "COMPLETED",
      workSummary: payload.workSummary,
      notes: payload.notes,
      completedAt: now.toISOString(),
    }
  }

  const complaintJob = await Complaint.findOneAndUpdate(
    query,
    {
      $set: {
        status: "WORK_COMPLETED",
        resolvedAt: now,
        resolvedBy: technicianUserId,
        completionDetails: {
          details: payload.workSummary,
          completedBy: technicianUserId,
          completedAt: now,
        },
      },
      $push: {
        remarks: {
          message: `Work completed: ${payload.workSummary}${
            payload.notes ? ` - Notes: ${payload.notes}` : ""
          }`,
          by: technicianUserId,
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!complaintJob) {
    throw new AppError("Maintenance job not found", 404)
  }

  return {
    success: true,
    status: "COMPLETED",
    workSummary: payload.workSummary,
    notes: payload.notes,
    completedAt: now.toISOString(),
  }
}