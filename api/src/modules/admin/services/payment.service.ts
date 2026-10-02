import { PipelineStage } from "mongoose";
import { AppError } from "../../../utils/AppError.js";
import { SubscriptionPayment } from "../../payment/subscription-payment.model.js";
import { Subscription } from "../../subscription/subscription.model.js";
import { Apartment } from "../../apartment/apartment.model.js";
import { SubscriptionPlan } from "../../subscription/subscription-plan.model.js";
import {
  GetAllPaymentsQuery,
  RevenueAnalyticsQuery,
  TopSocietiesQuery,
} from "../validation/payment.validation.js";
import {
  RevenueStats,
  MonthlyRevenue,
  RevenueAnalyticsData,
  BillingBreakdownData,
  PlanBreakdownItem,
  TopSocietyRevenueItem,
} from "../types.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const getAllSubscriptionPayments = async (query: GetAllPaymentsQuery) => {
  if (!query) {
    throw new AppError("Query parameters are required", 400);
  }

  const {
    page,
    limit,
    search,
    status,
    type,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;

  const matchConditions: Record<string, unknown>[] = [];

  if (status) {
    matchConditions.push({ status });
  }

  if (type && type !== "all") {
    const formattedType = type.replace(/_/g, " ").replace("SIX", "6");
    matchConditions.push({
      $or: [
        { planName: { $regex: type, $options: "i" } },
        { planName: { $regex: formattedType, $options: "i" } },
      ],
    });
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      matchConditions.push({ paidAt: dateFilter });
    }
  }

  if (search) {
    matchConditions.push({
      $or: [
        { "apartment.name": { $regex: search, $options: "i" } },
        { "apartment.city": { $regex: search, $options: "i" } },
        { planName: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
        { razorpaySubscriptionId: { $regex: search, $options: "i" } },
      ],
    });
  }

  const postLookupMatch =
    matchConditions.length > 0 ? { $and: matchConditions } : {};

  const sortStage = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: Apartment.collection.name,
        localField: "apartment",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1,
              city: 1,
              state: 1,
              address: 1,
            },
          },
        ],
        as: "apartment",
      },
    },
    {
      $unwind: {
        path: "$apartment",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $match: postLookupMatch },
    {
      $project: {
        apartment: 1,
        subscription: 1,
        planName: 1,
        amount: 1,
        taxAmount: 1,
        totalAmount: 1,
        currency: 1,
        razorpayPaymentId: 1,
        razorpaySubscriptionId: 1,
        status: 1,
        billingCycle: 1,
        paidAt: 1,
        createdAt: 1,
      },
    },
    {
      $facet: {
        data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await SubscriptionPayment.aggregate(pipeline);
  if (!result) {
    throw new AppError("Failed to fetch payments", 500);
  }

  const data = result[0]?.data ?? [];
  const total = result[0]?.totalCount?.[0]?.count ?? 0;

  return {
    payments: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRevenueStats = async (): Promise<RevenueStats> => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const startOfMonth = new Date(
    Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0)
  );
  const startOfNextMonth = new Date(
    Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0, 0)
  );

  const [paymentStatsResult, activeSubscribers, totalSocieties, paymentStatusCounts] = await Promise.all([
    SubscriptionPayment.aggregate<{
      totalRevenue: number;
      totalTransactions: number;
      revenueThisMonth: number;
    }>([
      {
        $match: { status: "captured" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          revenueThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$paidAt", startOfMonth] },
                    { $lt: ["$paidAt", startOfNextMonth] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]),
    Subscription.countDocuments({
      status: { $in: ["active", "authenticated"] },
    }),
    Apartment.countDocuments({ status: "active" }),
    SubscriptionPayment.aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const paymentStats = paymentStatsResult[0];
  const capturedCount =
    paymentStatusCounts.find((s) => s._id === "captured")?.count ?? 0;
  const failedCount =
    paymentStatusCounts.find((s) => s._id === "failed")?.count ?? 0;

  return {
    totalRevenue: paymentStats?.totalRevenue ?? 0,
    revenueThisMonth: paymentStats?.revenueThisMonth ?? 0,
    totalTransactions: paymentStats?.totalTransactions ?? 0,
    activeSubscribers,
    totalSocieties,
    capturedTransactions: capturedCount,
    failedTransactions: failedCount,
  };
};

export const getRevenueAnalytics = async (
  query?: Partial<RevenueAnalyticsQuery>
): Promise<RevenueAnalyticsData> => {
  const range = query?.range ?? "6m";
  let numMonths = 6;
  if (range === "3m") {
    numMonths = 3;
  } else if (range === "12m" || range === "1y") {
    numMonths = 12;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const startDate = new Date(
    Date.UTC(currentYear, currentMonth - (numMonths - 1), 1, 0, 0, 0, 0)
  );

  const aggregatedResults = await SubscriptionPayment.aggregate<{
    _id: string;
    revenue: number;
    count: number;
  }>([
    {
      $match: {
        status: "captured",
        paidAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$paidAt",
            timezone: "UTC",
          },
        },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const statsMap = new Map<string, { revenue: number; count: number }>();
  for (const item of aggregatedResults) {
    if (item._id) {
      statsMap.set(item._id, { revenue: item.revenue, count: item.count });
    }
  }

  const revenues: MonthlyRevenue[] = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const period = `${MONTH_NAMES[monthIndex]} ${year}`;

    const existing = statsMap.get(key);
    revenues.push({
      period,
      revenue: existing?.revenue ?? 0,
      count: existing?.count ?? 0,
    });
  }

  return {
    range,
    interval: "month",
    revenues,
  };
};

export const getBillingBreakdown = async (): Promise<BillingBreakdownData> => {
  const [allPlans, activeSubsByPlan, paymentStatuses, paymentsByPlan] = await Promise.all([
    SubscriptionPlan.find().lean(),
    Subscription.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          status: { $in: ["active", "authenticated"] },
        },
      },
      {
        $lookup: {
          from: SubscriptionPlan.collection.name,
          localField: "plan",
          foreignField: "_id",
          as: "planDoc",
        },
      },
      {
        $unwind: {
          path: "$planDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          resolvedPlanName: {
            $ifNull: ["$planSnapshot.planName", "$planDoc.planName"],
          },
        },
      },
      {
        $match: {
          resolvedPlanName: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$resolvedPlanName",
          count: { $sum: 1 },
        },
      },
    ]),
    SubscriptionPayment.aggregate<{
      _id: "captured" | "failed" | "refunded";
      count: number;
      amount: number;
    }>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    SubscriptionPayment.aggregate<{
      _id: string;
      revenue: number;
    }>([
      {
        $match: {
          status: "captured",
        },
      },
      {
        $group: {
          _id: "$planName",
          revenue: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const totalActiveSubscriptions = activeSubsByPlan.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const revenueByPlanMap = new Map<string, number>();
  for (const p of paymentsByPlan) {
    if (p._id) {
      revenueByPlanMap.set(p._id.toLowerCase(), p.revenue);
    }
  }

  const plansResult: PlanBreakdownItem[] = [];
  const processedPlanNames = new Set<string>();

  // Process all registered subscription plans from DB (Monthly, 6 Months, Yearly)
  for (const planDoc of allPlans) {
    const activeSub = activeSubsByPlan.find(
      (a) => a._id?.toLowerCase() === planDoc.planName.toLowerCase()
    );
    const count = activeSub?.count ?? 0;
    const percentage =
      totalActiveSubscriptions > 0
        ? Math.round((count / totalActiveSubscriptions) * 100)
        : 0;
    const revenue =
      revenueByPlanMap.get(planDoc.planName.toLowerCase()) ?? 0;

    processedPlanNames.add(planDoc.planName.toLowerCase());

    plansResult.push({
      planName: planDoc.planName,
      planType: planDoc.planType,
      count,
      percentage,
      revenue,
    });
  }

  // Include any other active subscription plan names that were not in allPlans
  for (const item of activeSubsByPlan) {
    const planName = item._id;
    if (planName && !processedPlanNames.has(planName.toLowerCase())) {
      processedPlanNames.add(planName.toLowerCase());
      const count = item.count;
      const percentage =
        totalActiveSubscriptions > 0
          ? Math.round((count / totalActiveSubscriptions) * 100)
          : 0;
      const revenue = revenueByPlanMap.get(planName.toLowerCase()) ?? 0;

      plansResult.push({
        planName,
        count,
        percentage,
        revenue,
      });
    }
  }

  if (plansResult.length === 0) {
    plansResult.push(
      { planName: "Yearly Plan", planType: "YEARLY", count: 0, percentage: 0, revenue: 0 },
      { planName: "6 Months Plan", planType: "SIX_MONTHS", count: 0, percentage: 0, revenue: 0 },
      { planName: "Monthly Plan", planType: "MONTHLY", count: 0, percentage: 0, revenue: 0 }
    );
  }

  plansResult.sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    if (b.count !== a.count) return b.count - a.count;
    return a.planName.localeCompare(b.planName);
  });

  const statusMap: Record<
    "captured" | "failed" | "refunded",
    { count: number; amount: number; percentage: number }
  > = {
    captured: { count: 0, amount: 0, percentage: 0 },
    failed: { count: 0, amount: 0, percentage: 0 },
    refunded: { count: 0, amount: 0, percentage: 0 },
  };

  let totalPaymentsCount = 0;
  for (const statusItem of paymentStatuses) {
    if (statusItem._id && statusMap[statusItem._id]) {
      statusMap[statusItem._id].count = statusItem.count;
      statusMap[statusItem._id].amount = statusItem.amount;
      totalPaymentsCount += statusItem.count;
    }
  }

  if (totalPaymentsCount > 0) {
    statusMap.captured.percentage = Math.round(
      (statusMap.captured.count / totalPaymentsCount) * 100
    );
    statusMap.failed.percentage = Math.round(
      (statusMap.failed.count / totalPaymentsCount) * 100
    );
    statusMap.refunded.percentage = Math.round(
      (statusMap.refunded.count / totalPaymentsCount) * 100
    );
  } else {
    statusMap.captured.percentage = 100;
  }

  return {
    totalActiveSubscriptions,
    plans: plansResult,
    statusBreakdown: statusMap,
  };
};

export const getTopRevenueSocieties = async (
  query?: TopSocietiesQuery
): Promise<TopSocietyRevenueItem[]> => {
  const limit = query?.limit ?? 5;
  const safeLimit = Math.max(1, Math.min(50, limit));

  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: "captured",
      },
    },
    {
      $group: {
        _id: "$apartment",
        totalRevenue: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
        lastPaidAt: { $max: "$paidAt" },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: safeLimit,
    },
    {
      $lookup: {
        from: Apartment.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "apartment",
      },
    },
    {
      $unwind: {
        path: "$apartment",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: Subscription.collection.name,
        let: { aptId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$apartment", "$$aptId"] },
                  { $in: ["$status", ["active", "authenticated"]] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { planSnapshot: 1 } },
        ],
        as: "activeSub",
      },
    },
    {
      $project: {
        _id: 0,
        apartmentId: { $toString: "$_id" },
        name: "$apartment.name",
        city: "$apartment.city",
        state: "$apartment.state",
        totalRevenue: 1,
        transactionCount: 1,
        lastPaidAt: 1,
        planName: {
          $ifNull: [
            { $arrayElemAt: ["$activeSub.planSnapshot.planName", 0] },
            "Subscription Plan",
          ],
        },
      },
    },
  ];

  const results =
    await SubscriptionPayment.aggregate<TopSocietyRevenueItem>(pipeline);

  if (results.length === 0) {
    const activeApartments = await Apartment.find({ status: "active" })
      .limit(safeLimit)
      .lean();

    return activeApartments.map((apt) => ({
      apartmentId: apt._id.toString(),
      name: apt.name,
      city: apt.city,
      state: apt.state,
      totalRevenue: 0,
      transactionCount: 0,
      planName: "Subscription Plan",
      lastPaidAt: null,
    }));
  }

  return results;
};

export const getSingleSubscriptionPayment = async (paymentId: string) => {
  const payment = await SubscriptionPayment.findById(paymentId)
    .populate("apartment", "name city state address contactNumber")
    .populate("subscription")
    .populate("plan")
    .lean();

  if (!payment) {
    throw new AppError("Payment record not found", 404);
  }

  return payment;
};
