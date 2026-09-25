import { Types } from "mongoose";
export interface AuthUserDoc {
  _id?: string | Types.ObjectId;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  image?: string | null;
  emailVerified?: boolean | null;
  createdAt?: Date | string;
}

export interface ApartmentStats {
  total: number;
  active: number;
  pending_payment: number;
  inactive: number;
}

export interface MonthlyRegistration {
  period: string;
  count: number;
}

export interface ApartmentAnalyticsData {
  range: string;
  interval: "month";
  registrations: MonthlyRegistration[];
}

export interface SubscriptionStats {
  total: number;
  created: number;
  authenticated: number;
  active: number;
  pending: number;
  halted: number;
  cancelled: number;
  completed: number;  
  expired: number;
  expiringSoon: number;
}

export interface SubscriptionAnalyticsData {
  range: string;
  interval: "month";
  subscriptions: MonthlyRegistration[];
}

export interface RevenueStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalTransactions: number;
  activeSubscribers: number;
  totalSocieties?: number;
  capturedTransactions?: number;
  failedTransactions?: number;
}

export interface MonthlyRevenue {
  period: string;
  revenue: number;
  count: number;
}

export interface RevenueAnalyticsData {
  range: string;
  interval: "month";
  revenues: MonthlyRevenue[];
}

export interface PlanBreakdownItem {
  planName: string;
  planType?: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface PaymentStatusDetail {
  count: number;
  percentage: number;
  amount: number;
}

export interface BillingBreakdownData {
  totalActiveSubscriptions: number;
  plans: PlanBreakdownItem[];
  statusBreakdown: {
    captured: PaymentStatusDetail;
    failed: PaymentStatusDetail;
    refunded: PaymentStatusDetail;
  };
}

export interface TopSocietyRevenueItem {
  apartmentId: string;
  name: string;
  city: string;
  state: string;
  totalRevenue: number;
  transactionCount: number;
  planName?: string;
  lastPaidAt?: Date | string | null;
}

