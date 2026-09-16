import { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { Complaint } from "../complaint/complaint.model.js"
import { Maintenance } from "../maintenance/maintenance.model.js"

export type AssignedJob = {
  jobId: string
  title: string
  category: string
  block: string
  flat: string
  priority: "High" | "Medium" | "Low"
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  assignedDate: string
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

const buildTechnicianScope = (
  technicianId?: string
): Record<string, unknown> => {
  if (!technicianId) return {}
  return {
    $or: [
      { assignedStaff: technicianId },
      { assignedTechnicianId: technicianId },
    ],
  }
}

export const getDashboardStats = async (technicianId?: string) => {
  const scopeFilter = buildTechnicianScope(technicianId)

  const [totalAssigned, pending, inProgress, completed] = await Promise.all([
    Maintenance.countDocuments(scopeFilter),
    Maintenance.countDocuments({
      ...scopeFilter,
      status: { $in: ["PENDING", "ASSIGNED"] },
    }),
    Maintenance.countDocuments({
      ...scopeFilter,
      status: { $in: ["IN_PROGRESS", "ON_HOLD"] },
    }),
    Maintenance.countDocuments({
      ...scopeFilter,
      status: {
        $in: [
          "COMPLETED",
          "WORK_COMPLETED",
          "AWAITING_APPROVAL",
          "APPROVED",
          "CLOSED",
        ],
      },
    }),
  ])

  return {
    stats: {
      totalAssigned,
      pending,
      inProgress,
      completed,
    },
  }
}

export const getAssignedJobs = async (
  status?: string,
  technicianId?: string
): Promise<AssignedJob[]> => {
  const filter: Record<string, unknown> = {
    ...buildTechnicianScope(technicianId),
  }

  if (status && status !== "ALL") {
    const s = status.toUpperCase()
    if (s === "ACTIVE") {
      filter.status = { $in: ["ASSIGNED", "IN_PROGRESS", "ON_HOLD"] }
    } else if (s === "COMPLETED" || s === "WORK_COMPLETED") {
      filter.status = {
        $in: [
          "COMPLETED",
          "WORK_COMPLETED",
          "AWAITING_APPROVAL",
          "APPROVED",
          "CLOSED",
        ],
      }
    } else if (s === "ASSIGNED" || s === "PENDING") {
      filter.status = { $in: ["PENDING", "ASSIGNED"] }
    } else if (s === "IN_PROGRESS") {
      filter.status = { $in: ["IN_PROGRESS", "ON_HOLD"] }
    } else {
      filter.status = s
    }
  }

  const docs = await Maintenance.find(filter)
    .sort({ createdAt: -1 })
    .lean()

  return docs.map((doc: any) => {
    const assignedDateVal = doc.assignedAt || doc.createdAt || new Date()
    const assignedDate = new Date(assignedDateVal).toISOString().split("T")[0]

    return {
      jobId: doc._id.toString(),
      title: doc.title || "Maintenance Request",
      category: doc.category || "General Maintenance",
      block: doc.apartment || "Block A",
      flat: doc.flat || "N/A",
      priority: mapPriority(doc.priority),
      status: mapStatus(doc.status),
      assignedDate,
    }
  })
}

export const getJobById = async (jobId: string): Promise<JobDetails> => {
  let doc: any = null

  if (Types.ObjectId.isValid(jobId)) {
    doc = await Maintenance.findById(jobId).populate("complaint").lean()
  }

  if (!doc) {
    doc = await Maintenance.findOne({
      $or: [{ _id: jobId }, { jobId: jobId }],
    })
      .populate("complaint")
      .lean()
      .catch(() => null)
  }

  if (!doc) {
    throw new AppError("Maintenance job not found", 404)
  }

  const assignedDateVal = doc.assignedAt || doc.createdAt || new Date()
  const createdDateVal = doc.createdAt || new Date()
  const mappedStatus = mapStatus(doc.status)
  const mappedPriority = mapPriority(doc.priority)
  const complaintObj =
    doc.complaint && typeof doc.complaint === "object" ? doc.complaint : null

  return {
    jobId: doc._id.toString(),
    complaintInfo: {
      title: doc.title || "Maintenance Request",
      description:
        doc.description ||
        "General maintenance and inspection required for this unit.",
      category: doc.category || "General Maintenance",
      priority: mappedPriority,
      status: mappedStatus,
      createdAt: new Date(createdDateVal).toISOString(),
      complaintImage:
        complaintObj?.image ||
        doc.image ||
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: doc.apartment || "Block A",
      flat: doc.flat || "N/A",
      floor: deriveFloor(doc.flat),
    },
    residentInfo: {
      name: doc.resident || complaintObj?.resident || "Resident",
      residentType: "Resident",
      contactNumber: complaintObj?.phone || "+91 98000 00000",
    },
    assignmentInfo: {
      assignedBy: doc.assignedBy || "Facility Manager",
      assignedDate: new Date(assignedDateVal).toISOString(),
      currentStatus: mappedStatus,
    },
  }
}

export const startJob = async (jobId: string, technicianId?: string) => {
  const query = Types.ObjectId.isValid(jobId) ? { _id: jobId } : { jobId }
  const now = new Date()

  const job = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        status: "IN_PROGRESS",
        startedAt: now,
        updatedBy: technicianId || "Technician",
      },
      $push: {
        progressUpdates: {
          details: "Maintenance work started by technician",
          status: "IN_PROGRESS",
          remarks: "Status changed to IN_PROGRESS",
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!job) {
    throw new AppError("Maintenance job not found", 404)
  }

  if (job.complaint) {
    await Complaint.findByIdAndUpdate(job.complaint, {
      $set: { status: "IN_PROGRESS" },
    }).catch(() => null)
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
  technicianId?: string
) => {
  const query = Types.ObjectId.isValid(jobId) ? { _id: jobId } : { jobId }
  const now = new Date()

  const job = await Maintenance.findOneAndUpdate(
    query,
    {
      $push: {
        progressUpdates: {
          details: message,
          status: "IN_PROGRESS",
          remarks: message,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
        workNotes: {
          message,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
      },
      $set: {
        updatedBy: technicianId || "Technician",
      },
    },
    { new: true }
  )

  if (!job) {
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
  file?: Express.Multer.File,
  technicianId?: string
) => {
  const query = Types.ObjectId.isValid(jobId) ? { _id: jobId } : { jobId }
  const filename = file?.filename || `evidence-${Date.now()}.jpg`
  const originalname = file?.originalname || "evidence.jpg"
  const fileUrl = `/uploads/${filename}`
  const now = new Date()

  const job = await Maintenance.findOneAndUpdate(
    query,
    {
      $push: {
        workNotes: {
          message: `Evidence uploaded: ${originalname} (${fileUrl})`,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
      },
      $set: {
        updatedBy: technicianId || "Technician",
      },
    },
    { new: true }
  )

  if (!job) {
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
  technicianId?: string
) => {
  const query = Types.ObjectId.isValid(jobId) ? { _id: jobId } : { jobId }
  const now = new Date()
  const numAmount = Number(amount) || 0

  const job = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        finalCost: numAmount,
        costReview: {
          status: "SUBMITTED",
          submittedAmount: numAmount,
          submittedBy: technicianId || "Technician",
          submittedAt: now,
          remarks: description || null,
        },
        updatedBy: technicianId || "Technician",
      },
      $push: {
        workNotes: {
          message: `Maintenance cost estimate submitted: ₹${numAmount}${
            description ? ` - ${description}` : ""
          }`,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!job) {
    throw new AppError("Maintenance job not found", 404)
  }

  if (job.complaint) {
    await Complaint.findByIdAndUpdate(job.complaint, {
      $set: { finalCost: numAmount },
    }).catch(() => null)
  }

  return {
    success: true,
    amount: numAmount,
    description,
    submittedAt: now.toISOString(),
  }
}

export const completeJob = async (
  jobId: string,
  payload: { workSummary: string; notes?: string },
  technicianId?: string
) => {
  const query = Types.ObjectId.isValid(jobId) ? { _id: jobId } : { jobId }
  const now = new Date()

  const job = await Maintenance.findOneAndUpdate(
    query,
    {
      $set: {
        status: "COMPLETED",
        completedAt: now,
        completionDetails: {
          details: payload.workSummary,
          workNotes: payload.notes || null,
          completedBy: technicianId || "Technician",
          completedAt: now,
        },
        updatedBy: technicianId || "Technician",
      },
      $push: {
        progressUpdates: {
          details: `Work completed: ${payload.workSummary}`,
          status: "COMPLETED",
          remarks: payload.notes || null,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
        workNotes: {
          message: `Work completed: ${payload.workSummary}${
            payload.notes ? ` - Notes: ${payload.notes}` : ""
          }`,
          by: technicianId || "Technician",
          role: "maintenance_technician",
          createdAt: now,
        },
      },
    },
    { new: true }
  )

  if (!job) {
    throw new AppError("Maintenance job not found", 404)
  }

  if (job.complaint) {
    await Complaint.findByIdAndUpdate(job.complaint, {
      $set: {
        status: "WORK_COMPLETED",
        completionDetails: {
          details: payload.workSummary,
          completedBy: technicianId || "Technician",
          completedAt: now,
        },
      },
    }).catch(() => null)
  }

  return {
    success: true,
    status: "COMPLETED",
    workSummary: payload.workSummary,
    notes: payload.notes,
    completedAt: now.toISOString(),
  }
}