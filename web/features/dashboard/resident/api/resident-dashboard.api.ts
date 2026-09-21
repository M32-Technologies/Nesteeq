import api from "@/lib/axios";
import { getResidentFeed } from "@/features/announcements/api/announcements.api";
import type { AnnouncementItem } from "@/features/announcements/types";

export interface GuestPassItem {
  _id: string;
  id?: string;
  apartmentId?: string;
  flatId?: string;
  flatNumber?: string | null;
  visitorName: string;
  visitorPhone?: string | null;
  purpose?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: "CAR" | "BIKE" | "EV" | "OTHER" | null;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  token?: string;
  qrCodeDataUrl?: string;
  usedAt?: string | null;
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
    maintenance?: {
      _id: string;
      costReview?: {
        status: string;
        submittedAmount?: number;
        remarks?: string;
        forwardedToRole?: string;
        forwardedAt?: string;
      };
      finalCost?: number;
      isSocietyCovered?: boolean;
      assignedStaff?: string;
      status?: string;
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
  _userEmail?: string,
  _userId?: string
): Promise<ResidentProfileItem | null> {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentProfileItem;
    }>("/api/v1/residents/me");
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchResidentGuestPasses(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const res = await api.get<{
      success: boolean;
      data: {
        guestPasses: GuestPassItem[];
        counts?: {
          total: number;
          activePassesCount: number;
          usedPassesCount: number;
          expiredPassesCount: number;
        };
        pagination: { total: number };
      };
    }>("/api/v1/residents/passes", { params });

    return res.data?.data?.guestPasses || [];
  } catch {
    try {
      const fallbackRes = await api.get<{
        success: boolean;
        data: {
          guestPasses: GuestPassItem[];
          pagination: { total: number };
        };
      }>("/api/visitors/passes", { params });

      return fallbackRes.data?.data?.guestPasses || [];
    } catch {
      return [];
    }
  }
}

export async function fetchResidentComplaints(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
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
        ...(params?.search ? { search: params.search } : {}),
      },
    });

    return res.data?.data || { complaints: [], pagination: { total: 0, page: 1, limit: 5, pages: 1 } };
  } catch {
    return { complaints: [], pagination: { total: 0, page: 1, limit: 5, pages: 1 } };
  }
}

export interface ResidentDashboardFeedItem {
  id: string;
  type: "ANNOUNCEMENT" | "COMPLAINT" | "PASS";
  title: string;
  subtitle?: string;
  meta: string;
  description: string;
  badge: {
    label: string;
    variant: "amber" | "emerald" | "blue" | "rose" | "purple";
  };
  tags: string[];
  author: {
    name: string;
    verified: boolean;
    role?: string;
  };
  ctaText: string;
  ctaHref: string;
  date: string;
  rawDate: string;
}

export interface ResidentDashboardFeedResponse {
  feed: ResidentDashboardFeedItem[];
  counts: {
    activeComplaints: number;
    activePasses: number;
    totalAnnouncements: number;
  };
}

export async function fetchResidentDashboardFeed(): Promise<ResidentDashboardFeedResponse> {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentDashboardFeedResponse;
    }>("/api/v1/residents/dashboard/feed");
    return res.data?.data || {
      feed: [],
      counts: { activeComplaints: 0, activePasses: 0, totalAnnouncements: 0 },
    };
  } catch {
    return {
      feed: [],
      counts: { activeComplaints: 0, activePasses: 0, totalAnnouncements: 0 },
    };
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

export interface AdditionalChargeItem {
  title: string;
  amount: number;
  reason?: string;
}

export interface ResidentBillItem {
  _id: string;
  apartmentId: string;
  unitId: string;
  residentId: string;
  baseAmount: number;
  additionalCharges: AdditionalChargeItem[];
  lateFeePerDay: number;
  lateFeeAmount: number;
  lateFeeWaivedAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  createdAt: string;
}

export interface ResidentBillsSummary {
  totalOutstanding: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
  lateFees: number;
}

export interface ResidentPaymentItem {
  _id: string;
  billId?: string;
  amount: number;
  source: string;
  description?: string;
  paidAt: string;
}

export interface ResidentBillsResponse {
  summary: ResidentBillsSummary;
  bills: ResidentBillItem[];
  recentPayments: ResidentPaymentItem[];
}

export async function fetchResidentBills(): Promise<ResidentBillsResponse> {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentBillsResponse;
    }>("/api/v1/bills/my-bills");
    return (
      res.data?.data || {
        summary: {
          totalOutstanding: 0,
          totalPaid: 0,
          pendingCount: 0,
          overdueCount: 0,
          lateFees: 0,
        },
        bills: [],
        recentPayments: [],
      }
    );
  } catch {
    return {
      summary: {
        totalOutstanding: 0,
        totalPaid: 0,
        pendingCount: 0,
        overdueCount: 0,
        lateFees: 0,
      },
      bills: [],
      recentPayments: [],
    };
  }
}

export async function payResidentBill(
  billId: string,
  payload: {
    amount?: number;
    paymentMethod?: string;
    referenceNo?: string;
    description?: string;
  }
) {
  const res = await api.post(`/api/v1/bills/${encodeURIComponent(billId)}/pay`, payload);
  return res.data;
}

export interface CreateResidentComplaintPayload {
  title: string;
  description: string;
  category: "PLUMBING" | "ELECTRICAL" | "CLEANING" | "SECURITY" | "LIFT" | "WATER" | "MAINTENANCE" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export async function createResidentComplaint(payload: CreateResidentComplaintPayload) {
  const res = await api.post<{
    success: boolean;
    message?: string;
    data: any;
  }>("/api/v1/complaints", payload);

  return res.data;
}

export interface ResidentVehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: "CAR" | "BIKE" | "EV" | "BICYCLE" | "OTHER";
  makeModel: string;
  color: string;
  rfidTag: string;
  parkingSlotId?: string | null;
  status: "ACTIVE" | "INACTIVE";
  evChargingRequired: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface ResidentAssignedSlot {
  _id: string;
  slotNumber: string;
  level: string;
  zoneName?: string | null;
  zoneCode?: string | null;
  prefix: string;
  vehicleType: string;
  status: string;
  vehicleNumber?: string | null;
  isRegistered?: boolean;
}

export interface ResidentParkingInfoResponse {
  vehicles: ResidentVehicle[];
  assignedSlots: ResidentAssignedSlot[];
  availableSlots?: ResidentAssignedSlot[];
  totalSlotsAssigned?: number;
  availableSlotsCount?: number;
  isSlotLimitReached?: boolean;
  flatUnitName: string;
  guestQuota?: {
    monthlyTotal: number;
    usedThisMonth: number;
    remaining: number;
  };
  rfidClearanceActive: boolean;
}

export interface RegisterVehiclePayload {
  slotId?: string;
  vehicleNumber: string;
  vehicleType?: "CAR" | "BIKE" | "EV" | "BICYCLE" | "OTHER";
  makeModel?: string;
  color?: string;
  rfidTag?: string;
  evChargingRequired?: boolean;
  notes?: string;
}

export async function fetchResidentParkingInfo(): Promise<ResidentParkingInfoResponse> {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentParkingInfoResponse;
    }>("/api/v1/residents/me/parking-info");
    return res.data?.data || {
      vehicles: [],
      assignedSlots: [],
      flatUnitName: "Assigned Unit",
      guestQuota: { monthlyTotal: 2, usedThisMonth: 0, remaining: 2 },
      rfidClearanceActive: true,
    };
  } catch {
    return {
      vehicles: [],
      assignedSlots: [],
      flatUnitName: "Assigned Unit",
      guestQuota: { monthlyTotal: 2, usedThisMonth: 0, remaining: 2 },
      rfidClearanceActive: true,
    };
  }
}

export async function registerResidentVehicle(payload: RegisterVehiclePayload) {
  const res = await api.post<{
    success: boolean;
    data: ResidentVehicle;
    message?: string;
  }>("/api/v1/residents/vehicles", payload);
  return res.data;
}

export async function deleteResidentVehicle(vehicleId: string) {
  const res = await api.delete<{
    success: boolean;
    message?: string;
  }>(`/api/v1/residents/vehicles/${encodeURIComponent(vehicleId)}`);
  return res.data;
}

export interface CreateResidentGuestPassPayload {
  flatId?: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  vehicleNumber?: string;
  vehicleType?: "CAR" | "BIKE" | "EV" | "OTHER";
  validFrom?: string;
  validUntil?: string;
  durationHours?: number;
}

export interface CreateResidentGuestPassResponse {
  success: boolean;
  data: {
    guestPass: GuestPassItem;
    token: string;
    qrCodeDataUrl: string;
  };
  message?: string;
}

export async function createResidentGuestPass(payload: CreateResidentGuestPassPayload): Promise<CreateResidentGuestPassResponse> {
  try {
    const res = await api.post<CreateResidentGuestPassResponse>(
      "/api/v1/residents/passes",
      payload
    );
    return res.data;
  } catch (error) {
    const fallbackRes = await api.post<CreateResidentGuestPassResponse>(
      "/api/visitors/passes",
      payload
    );
    return fallbackRes.data;
  }
}

export async function cancelResidentGuestPass(passId: string) {
  try {
    const res = await api.patch<{
      success: boolean;
      message?: string;
    }>(`/api/v1/residents/passes/${encodeURIComponent(passId)}/cancel`);
    return res.data;
  } catch {
    const fallbackRes = await api.patch<{
      success: boolean;
      message?: string;
    }>(`/api/visitors/passes/${encodeURIComponent(passId)}/cancel`);
    return fallbackRes.data;
  }
}

