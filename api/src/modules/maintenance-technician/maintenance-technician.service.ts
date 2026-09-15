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

export const getDashboardStats = async () => {
  return {
    stats: {
      totalAssigned: 14,
      pending: 5,
      inProgress: 3,
      completed: 6,
    },
  }
}

const dummyJobs: AssignedJob[] = [
  {
    jobId: "MT-1024",
    title: "Water leakage under kitchen sink",
    category: "Plumbing",
    block: "Block A",
    flat: "A-304",
    priority: "High",
    status: "ASSIGNED",
    assignedDate: "2026-09-08",
  },
  {
    jobId: "MT-1025",
    title: "Ceiling fan making strange noise",
    category: "Electrical",
    block: "Block B",
    flat: "B-201",
    priority: "Medium",
    status: "IN_PROGRESS",
    assignedDate: "2026-09-08",
  },
  {
    jobId: "MT-1026",
    title: "Main door handle and lock jammed",
    category: "Carpentry",
    block: "Block C",
    flat: "C-105",
    priority: "Low",
    status: "ASSIGNED",
    assignedDate: "2026-09-07",
  },
  {
    jobId: "MT-1027",
    title: "Bathroom geyser not heating water",
    category: "Electrical",
    block: "Block A",
    flat: "A-502",
    priority: "High",
    status: "IN_PROGRESS",
    assignedDate: "2026-09-06",
  },
  {
    jobId: "MT-1028",
    title: "Balcony drain blockage causing overflow",
    category: "Plumbing",
    block: "Block D",
    flat: "D-102",
    priority: "Medium",
    status: "ASSIGNED",
    assignedDate: "2026-09-05",
  },
  {
    jobId: "MT-1020",
    title: "Kitchen exhaust pipe replacement and resealing",
    category: "Plumbing",
    block: "Block B",
    flat: "B-401",
    priority: "Medium",
    status: "COMPLETED",
    assignedDate: "2026-09-02",
  },
  {
    jobId: "MT-1021",
    title: "Distribution box circuit breaker trip repair",
    category: "Electrical",
    block: "Block A",
    flat: "A-203",
    priority: "High",
    status: "COMPLETED",
    assignedDate: "2026-09-01",
  },
]

const dummyDetailsMap: Record<string, JobDetails> = {
  "MT-1024": {
    jobId: "MT-1024",
    complaintInfo: {
      title: "Water leakage under kitchen sink",
      description:
        "Resident reported continuous water dripping from the inlet valve under the kitchen counter. Causes water pooling on the kitchen floor.",
      category: "Plumbing",
      priority: "High",
      status: "ASSIGNED",
      createdAt: "2026-09-08T09:30:00.000Z",
      complaintImage:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block A",
      flat: "A-304",
      floor: "3rd Floor",
    },
    residentInfo: {
      name: "Ramesh Sharma",
      residentType: "Owner",
      contactNumber: "+91 98765 43210",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-08T10:15:00.000Z",
      currentStatus: "ASSIGNED",
    },
  },
  "MT-1025": {
    jobId: "MT-1025",
    complaintInfo: {
      title: "Ceiling fan making strange noise",
      description:
        "Living room ceiling fan makes a loud clicking noise at high speed. Wobbling observed during operation.",
      category: "Electrical",
      priority: "Medium",
      status: "IN_PROGRESS",
      createdAt: "2026-09-08T08:00:00.000Z",
      complaintImage:
        "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block B",
      flat: "B-201",
      floor: "2nd Floor",
    },
    residentInfo: {
      name: "Priya Nair",
      residentType: "Tenant",
      contactNumber: "+91 94471 23456",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-08T09:00:00.000Z",
      currentStatus: "IN_PROGRESS",
    },
  },
  "MT-1026": {
    jobId: "MT-1026",
    complaintInfo: {
      title: "Main door handle and lock jammed",
      description:
        "Front entry door handle is loose and key gets stuck in the deadbolt lock mechanism.",
      category: "Carpentry",
      priority: "Low",
      status: "ASSIGNED",
      createdAt: "2026-09-07T14:20:00.000Z",
      complaintImage:
        "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block C",
      flat: "C-105",
      floor: "1st Floor",
    },
    residentInfo: {
      name: "Anand Menon",
      residentType: "Owner",
      contactNumber: "+91 98950 98765",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-07T16:00:00.000Z",
      currentStatus: "ASSIGNED",
    },
  },
  "MT-1027": {
    jobId: "MT-1027",
    complaintInfo: {
      title: "Bathroom geyser not heating water",
      description:
        "Master bathroom water heater indicator turns on but water does not heat up. Suspected heating element failure.",
      category: "Electrical",
      priority: "High",
      status: "IN_PROGRESS",
      createdAt: "2026-09-06T11:45:00.000Z",
      complaintImage:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block A",
      flat: "A-502",
      floor: "5th Floor",
    },
    residentInfo: {
      name: "Suresh Kumar",
      residentType: "Owner",
      contactNumber: "+91 97455 11223",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-06T12:30:00.000Z",
      currentStatus: "IN_PROGRESS",
    },
  },
  "MT-1028": {
    jobId: "MT-1028",
    complaintInfo: {
      title: "Balcony drain blockage causing overflow",
      description:
        "Rainwater drain pipe in the utility balcony is clogged with debris, causing slow drainage and stagnant water.",
      category: "Plumbing",
      priority: "Medium",
      status: "ASSIGNED",
      createdAt: "2026-09-05T16:10:00.000Z",
      complaintImage:
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block D",
      flat: "D-102",
      floor: "1st Floor",
    },
    residentInfo: {
      name: "Kavitha R.",
      residentType: "Tenant",
      contactNumber: "+91 98460 33445",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-05T17:00:00.000Z",
      currentStatus: "ASSIGNED",
    },
  },
  "MT-1020": {
    jobId: "MT-1020",
    complaintInfo: {
      title: "Kitchen exhaust pipe replacement and resealing",
      description:
        "Exhaust duct had grease buildup and loose fitting. Replaced section and resealed with aluminum foil tape.",
      category: "Plumbing",
      priority: "Medium",
      status: "COMPLETED",
      createdAt: "2026-09-02T08:30:00.000Z",
    },
    locationInfo: {
      block: "Block B",
      flat: "B-401",
      floor: "4th Floor",
    },
    residentInfo: {
      name: "Deepak Menon",
      residentType: "Owner",
      contactNumber: "+91 98450 11223",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-02T09:15:00.000Z",
      currentStatus: "COMPLETED",
    },
  },
  "MT-1021": {
    jobId: "MT-1021",
    complaintInfo: {
      title: "Distribution box circuit breaker trip repair",
      description:
        "Main 32A MCB kept tripping under load. Diagnosed neutral short in utility room, replaced breaker, tested under 25A continuous load.",
      category: "Electrical",
      priority: "High",
      status: "COMPLETED",
      createdAt: "2026-09-01T11:00:00.000Z",
    },
    locationInfo: {
      block: "Block A",
      flat: "A-203",
      floor: "2nd Floor",
    },
    residentInfo: {
      name: "Anjali Gupta",
      residentType: "Tenant",
      contactNumber: "+91 97412 88990",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager (Rajesh V.)",
      assignedDate: "2026-09-01T11:30:00.000Z",
      currentStatus: "COMPLETED",
    },
  },
}

export const getAssignedJobs = async (status?: string): Promise<AssignedJob[]> => {
  if (!status || status === "ALL") {
    return dummyJobs
  }
  if (status === "ACTIVE") {
    return dummyJobs.filter(
      (j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS"
    )
  }
  return dummyJobs.filter(
    (j) => j.status.toUpperCase() === status.toUpperCase()
  )
}

export const getJobById = async (jobId: string): Promise<JobDetails> => {
  if (dummyDetailsMap[jobId]) {
    return dummyDetailsMap[jobId]
  }

  // Fallback for any requested ID
  return {
    jobId,
    complaintInfo: {
      title: `Maintenance Request (${jobId})`,
      description: "General maintenance and inspection required for this unit.",
      category: "General Maintenance",
      priority: "Medium",
      status: "ASSIGNED",
      createdAt: new Date().toISOString(),
      complaintImage:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    },
    locationInfo: {
      block: "Block A",
      flat: "A-101",
      floor: "1st Floor",
    },
    residentInfo: {
      name: "Resident User",
      residentType: "Resident",
      contactNumber: "+91 98000 00000",
    },
    assignmentInfo: {
      assignedBy: "Facility Manager",
      assignedDate: new Date().toISOString(),
      currentStatus: "ASSIGNED",
    },
  }
}

export const startJob = async (jobId: string) => {
  if (dummyDetailsMap[jobId]) {
    dummyDetailsMap[jobId].assignmentInfo.currentStatus = "IN_PROGRESS"
    dummyDetailsMap[jobId].complaintInfo.status = "IN_PROGRESS"
  }
  const jobInList = dummyJobs.find((j) => j.jobId === jobId)
  if (jobInList) {
    jobInList.status = "IN_PROGRESS"
  }

  return {
    success: true,
    status: "IN_PROGRESS",
    startedAt: new Date(),
  }
}

export const addProgressUpdate = async (jobId: string, message: string) => {
  return {
    success: true,
    message,
    createdAt: new Date(),
  }
}

export const uploadEvidence = async (
  jobId: string,
  file?: Express.Multer.File
) => {
  const filename = file?.filename || `evidence-${Date.now()}.jpg`
  const originalname = file?.originalname || "evidence.jpg"

  return {
    success: true,
    fileUrl: `/uploads/${filename}`,
    fileName: originalname,
  }
}

export const submitCost = async (
  jobId: string,
  amount: number,
  description: string
) => {
  return {
    success: true,
    amount: Number(amount),
    description,
    submittedAt: new Date(),
  }
}

export const completeJob = async (
  jobId: string,
  payload: { workSummary: string; notes?: string }
) => {
  if (dummyDetailsMap[jobId]) {
    dummyDetailsMap[jobId].assignmentInfo.currentStatus = "COMPLETED"
    dummyDetailsMap[jobId].complaintInfo.status = "COMPLETED"
  }
  const jobInList = dummyJobs.find((j) => j.jobId === jobId)
  if (jobInList) {
    jobInList.status = "COMPLETED"
  }

  return {
    success: true,
    status: "COMPLETED",
    workSummary: payload.workSummary,
    notes: payload.notes,
    completedAt: new Date(),
  }
}