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

export interface ResidentDuesSummary {
  unitNumber: string;
  block: string;
  floor: string;
  bhk: string;
  areaSqFt: number;
  carpetSqFt: number;
  maintenancePerSqFt: number;
  societyMaintenance: number;
  sinkingFund: number;
  totalPayable: number;
  dueDate: string;
  lastPayment: {
    amount: number;
    date: string;
    method: string;
  };
  complianceStatus: string;
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
