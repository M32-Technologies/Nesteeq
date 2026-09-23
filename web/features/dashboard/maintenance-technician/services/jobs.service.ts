import { isAxiosError } from "axios"

import api from "@/lib/axios"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  error?: string
  details?: unknown
}

export type AssignedJob = {
  jobId: string
  title: string
  category: string
  block: string
  flat: string
  priority: "High" | "Medium" | "Low"
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  assignedDate: string
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

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message || error.response?.data?.error || fallback
    )
  }

  return error instanceof Error ? error.message : fallback
}

export const getAssignedJobs = async (status?: string): Promise<AssignedJob[]> => {
  try {
    const response = await api.get<ApiResponse<AssignedJob[]>>(
      "/api/maintenance-technician/jobs",
      {
        params: status && status !== "ALL" ? { status } : undefined,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch assigned jobs")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch assigned jobs"))
  }
}

export const getJobById = async (jobId: string): Promise<JobDetails> => {
  try {
    const response = await api.get<ApiResponse<JobDetails>>(
      `/api/maintenance-technician/jobs/${jobId}`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch job details")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch job details"))
  }
}

export type StartWorkResponse = {
  success: boolean
  status: string
  startedAt: string
}

export type ProgressUpdate = {
  message: string
  createdAt: string
}

export const startWork = async (jobId: string): Promise<StartWorkResponse> => {
  try {
    const response = await api.patch<ApiResponse<StartWorkResponse>>(
      `/api/maintenance-technician/jobs/${jobId}/start`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to start maintenance job")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to start maintenance job"))
  }
}

export const addProgress = async (
  jobId: string,
  message: string
): Promise<ProgressUpdate> => {
  try {
    const response = await api.post<ApiResponse<ProgressUpdate>>(
      `/api/maintenance-technician/jobs/${jobId}/progress`,
      { message }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to add progress update")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to add progress update"))
  }
}

export type UploadEvidenceResponse = {
  success: boolean
  fileUrl: string
  fileName: string
}

export type SubmitCostPayload = {
  amount: number
  description: string
}

export type SubmitCostResponse = {
  success: boolean
  amount: number
  description: string
  submittedAt: string
}

export const uploadEvidence = async (
  jobId: string,
  formData: FormData
): Promise<UploadEvidenceResponse> => {
  try {
    const response = await api.post<ApiResponse<UploadEvidenceResponse>>(
      `/api/maintenance-technician/jobs/${jobId}/evidence`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to upload evidence")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to upload evidence"))
  }
}

export const submitCost = async (
  jobId: string,
  payload: SubmitCostPayload
): Promise<SubmitCostResponse> => {
  try {
    const response = await api.post<ApiResponse<SubmitCostResponse>>(
      `/api/maintenance-technician/jobs/${jobId}/cost`,
      payload
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to submit cost")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to submit cost"))
  }
}

export type CompleteWorkPayload = {
  workSummary: string
  notes?: string
}

export type CompleteWorkResponse = {
  success: boolean
  status: string
  completedAt: string
  workSummary?: string
  notes?: string
}

export const completeWork = async (
  jobId: string,
  payload: CompleteWorkPayload
): Promise<CompleteWorkResponse> => {
  try {
    const response = await api.patch<ApiResponse<CompleteWorkResponse>>(
      `/api/maintenance-technician/jobs/${jobId}/complete`,
      payload
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to mark work as completed")
    }

    return response.data.data
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to mark work as completed")
    )
  }
}