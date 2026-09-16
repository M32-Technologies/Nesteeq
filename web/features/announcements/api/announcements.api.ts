import api from "@/lib/axios";
import type {
  AnnouncementFilterState,
  AnnouncementItem,
  AnnouncementStatus,
  BlockItem,
  CreateAnnouncementFormData,
  EmergencyBroadcastFormData,
  EmergencyBroadcastResponse,
  GetAnnouncementsApiResponse,
} from "../types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const getAnnouncements = async (
  filters: Partial<AnnouncementFilterState> = {}
): Promise<GetAnnouncementsApiResponse> => {
  const params: Record<string, string | number> = {};

  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search && filters.search.trim()) {
    params.search = filters.search.trim();
  }
  if (filters.status && filters.status !== "all") {
    params.status = filters.status;
  }
  if (filters.type && filters.type !== "all") {
    params.type = filters.type;
  }
  if (filters.target && filters.target !== "all") {
    params.targetType = filters.target;
  }

  const response = await api.get<ApiResponse<GetAnnouncementsApiResponse>>(
    "/api/v1/announcements",
    { params }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch announcements");
  }

  return response.data.data;
};

export const getAnnouncementById = async (
  announcementId: string
): Promise<AnnouncementItem> => {
  const response = await api.get<ApiResponse<AnnouncementItem>>(
    `/api/v1/announcements/${announcementId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch announcement");
  }

  return response.data.data;
};

export const createAnnouncement = async (
  formData: CreateAnnouncementFormData
): Promise<AnnouncementItem> => {
  const payload = {
    title: formData.title,
    message: formData.message,
    type: formData.type,
    priority: formData.priority,
    status: formData.status,
    targetType: formData.targetType,
    targetIds: formData.targetType === "BLOCK" ? formData.targetIds : [],
    expiresAt: formData.hasExpiry && formData.expiresAt ? formData.expiresAt : null,
  };

  const response = await api.post<ApiResponse<AnnouncementItem>>(
    "/api/v1/announcements",
    payload
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to create announcement");
  }

  return response.data.data;
};

export const updateAnnouncement = async (
  announcementId: string,
  formData: Partial<CreateAnnouncementFormData>
): Promise<AnnouncementItem> => {
  const payload: Record<string, unknown> = {};

  if (formData.title !== undefined) payload.title = formData.title;
  if (formData.message !== undefined) payload.message = formData.message;
  if (formData.type !== undefined) payload.type = formData.type;
  if (formData.priority !== undefined) payload.priority = formData.priority;
  if (formData.status !== undefined) payload.status = formData.status;
  if (formData.targetType !== undefined) payload.targetType = formData.targetType;
  if (formData.targetIds !== undefined) {
    payload.targetIds = formData.targetType === "BLOCK" ? formData.targetIds : [];
  }
  if (formData.hasExpiry !== undefined) {
    payload.expiresAt =
      formData.hasExpiry && formData.expiresAt ? formData.expiresAt : null;
  }

  const response = await api.patch<ApiResponse<AnnouncementItem>>(
    `/api/v1/announcements/${announcementId}`,
    payload
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update announcement");
  }

  return response.data.data;
};

export const updateAnnouncementStatus = async (
  announcementId: string,
  status: AnnouncementStatus
): Promise<AnnouncementItem> => {
  const response = await api.patch<ApiResponse<AnnouncementItem>>(
    `/api/v1/announcements/${announcementId}/status`,
    { status }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update announcement status");
  }

  return response.data.data;
};

export const deleteAnnouncement = async (
  announcementId: string
): Promise<{ id: string; deleted: true }> => {
  const response = await api.delete<ApiResponse<{ id: string; deleted: true }>>(
    `/api/v1/announcements/${announcementId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to delete announcement");
  }

  return response.data.data;
};

export const getActiveBlocks = async (): Promise<BlockItem[]> => {
  const response = await api.get<ApiResponse<{ blocks: BlockItem[] }>>(
    "/api/v1/blocks",
    {
      params: { status: "active" },
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch blocks");
  }

  const rawBlocks = response.data.data.blocks || [];
  return rawBlocks
    .map((b) => ({
      id: b.id || b._id || "",
      blockname: b.blockname,
      code: b.code,
      totalFloors: b.totalFloors,
      status: b.status,
    }))
    .filter((b) => b.id && b.status !== "inactive");
};

export const broadcastEmergency = async (
  formData: EmergencyBroadcastFormData
): Promise<EmergencyBroadcastResponse> => {
  const response = await api.post<ApiResponse<EmergencyBroadcastResponse>>(
    "/api/v1/announcements/emergency",
    formData
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to broadcast emergency alert"
    );
  }

  return response.data.data;
};
