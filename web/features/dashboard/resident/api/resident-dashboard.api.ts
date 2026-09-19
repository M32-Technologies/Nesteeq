import api from "@/lib/axios";
import { getResidentFeed } from "@/features/announcements/api/announcements.api";
import type { AnnouncementItem } from "@/features/announcements/types";

export interface GuestPassItem {
  _id: string;
  id?: string;
  visitorName: string;
  visitorPhone?: string | null;
  purpose?: string | null;
  vehicleNumber?: string | null;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  token?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
}

export interface ResidentComplaintsResponse {
  complaints: Array<{
    _id: string;
    id?: string;
    ticketNumber?: string;
    title: string;
    description: string;
    category: string;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    status: "PENDING" | "UNDER_REVIEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
    assignedStaff?: {
      _id: string;
      name: string;
      role?: string;
      phone?: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CurrentApartment {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  totalUnits?: number;
  status?: string;
}

export interface ResidentFlatInfo {
  _id: string;
  flatNumber: string;
  floorNumber?: number;
  occupancyStatus?: string;
  blockId?: {
    _id: string;
    blockname?: string;
    code?: string;
  } | null;
}

export interface ResidentProfileItem {
  id: string;
  apartmentId: string;
  userId: string;
  name?: string;
  email?: string | null;
  role?: string;
  residentType?: "owner" | "resident";
  phone?: string | null;
  status?: string;
  flat?: ResidentFlatInfo | null;
  joinedAt?: string;
}

export async function fetchCurrentApartment(): Promise<CurrentApartment | null> {
  try {
    const res = await api.get<{
      success: boolean;
      data: CurrentApartment;
    }>("/api/v1/apartment/current");
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchCurrentResidentProfile(
  userEmail?: string,
  userId?: string
): Promise<ResidentProfileItem | null> {
  try {
    const res = await api.get<{
      success: boolean;
      data: {
        residents: ResidentProfileItem[];
      };
    }>("/api/v1/residents", {
      params: userEmail ? { search: userEmail } : undefined,
    });

    const list = res.data?.data?.residents || [];
    if (list.length > 0) {
      if (userEmail) {
        const found = list.find(
          (r) =>
            r.email?.toLowerCase() === userEmail.toLowerCase() ||
            (userId && r.userId === userId)
        );
        if (found) return found;
      }
      return list[0];
    }

    if (userEmail || userId) {
      const fallbackRes = await api.get<{
        success: boolean;
        data: {
          residents: ResidentProfileItem[];
        };
      }>("/api/v1/residents", { params: { limit: 50 } });

      const fallbackList = fallbackRes.data?.data?.residents || [];
      const match = fallbackList.find(
        (r) =>
          (userEmail && r.email?.toLowerCase() === userEmail.toLowerCase()) ||
          (userId && r.userId === userId)
      );
      if (match) return match;
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchResidentGuestPasses(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const res = await api.get<{
      success: boolean;
      data: {
        guestPasses: GuestPassItem[];
        pagination: { total: number };
      };
    }>("/api/visitors/passes", { params });

    return res.data?.data?.guestPasses || [];
  } catch {
    // If backend endpoint is unauthorized or empty, fallback gracefully
    return [];
  }
}

export async function fetchResidentComplaints(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentComplaintsResponse;
    }>("/api/v1/complaints", {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 5,
        ...(params?.status ? { status: params.status } : {}),
      },
    });

    return res.data?.data || { complaints: [], pagination: { total: 0, page: 1, limit: 5, pages: 1 } };
  } catch {
    return { complaints: [], pagination: { total: 0, page: 1, limit: 5, pages: 1 } };
  }
}

export async function fetchResidentDashboardAnnouncements(): Promise<AnnouncementItem[]> {
  try {
    const data = await getResidentFeed();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
