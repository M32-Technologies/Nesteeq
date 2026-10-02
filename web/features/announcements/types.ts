export type AnnouncementType =
  | "GENERAL"
  | "MAINTENANCE"
  | "EVENTS_SOCIAL"
  | "EMERGENCY"
  | "COMMUNITY_COUNCIL";

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AnnouncementTargetType = "ALL_RESIDENTS" | "BLOCK";

export interface CreatorSummary {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface TargetBlockSummary {
  id: string;
  blockname: string;
  code: string;
}

export interface AnnouncementItem {
  id: string;
  apartmentId?: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetIds?: string[];
  targetBlocks?: TargetBlockSummary[];
  createdBy: string;
  creator?: CreatorSummary | null;
  creatorRole?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  readCount?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export interface GetAnnouncementsApiResponse {
  announcements: AnnouncementItem[];
  pagination: PaginationMeta;
  stats?: AnnouncementStats;
}

export interface AnnouncementFilterState {
  search: string;
  status: "all" | AnnouncementStatus;
  type: "all" | AnnouncementType;
  target: "all" | AnnouncementTargetType;
  priority: "all" | AnnouncementPriority;
  page: number;
  limit: number;
}

export interface CreateAnnouncementFormData {
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetType: AnnouncementTargetType;
  targetIds: string[];
  hasExpiry: boolean;
  expiresAt: string;
  status: AnnouncementStatus;
}

export interface BlockItem {
  id: string;
  _id?: string;
  blockname: string;
  code: string;
  totalFloors?: number;
  status?: "active" | "inactive";
}

export const EmergencyAlertCategory = {
  FIRE: "FIRE",
  GAS_LEAK: "GAS_LEAK",
  MEDICAL: "MEDICAL",
  SECURITY: "SECURITY",
  WEATHER: "WEATHER",
  INFRASTRUCTURE: "INFRASTRUCTURE",
  WATER_CONTAMINATION: "WATER_CONTAMINATION",
  OTHER: "OTHER",
} as const;

export type EmergencyAlertCategory =
  (typeof EmergencyAlertCategory)[keyof typeof EmergencyAlertCategory];

export interface EmergencyBroadcastFormData {
  category: EmergencyAlertCategory;
  title: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetIds: string[];
  actionInstructions?: string;
  contactPhone?: string;
}

export interface EmergencyBroadcastResponse {
  id: string;
  apartmentId: string;
  category: EmergencyAlertCategory;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetBlocks?: TargetBlockSummary[];
  actionInstructions?: string;
  contactPhone?: string;
  createdBy: string;
  publishedAt: string;
  estimatedAudience: {
    residentsCount: number;
    flatsCount: number;
  };
}

export interface CriticalAlertData {
  id: string;
  badgeText: string;
  scheduleText: string;
  title: string;
  description: string;
  affectedBlocks: string[];
  actionGuidelines: string[];
  hotlineNumbers: Array<{
    label: string;
    number: string;
    description: string;
  }>;
}

