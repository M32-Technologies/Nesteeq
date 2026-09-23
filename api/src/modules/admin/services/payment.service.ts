import { PipelineStage } from "mongoose";
import { AppError } from "../../../utils/AppError.js";
import { SubscriptionPayment } from "../../payment/subscription-payment.model.js";
import { Subscription } from "../../subscription/subscription.model.js";
import {
  GetAllPaymentsQuery,
  RevenueAnalyticsQuery,
} from "../validation/payment.validation.js";
import {
  RevenueStats,
  MonthlyRevenue,
  RevenueAnalyticsData,
} from "../types.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const getAllSubscriptionPayments = async (query: GetAllPaymentsQuery) => {
  if (!query) {
    throw new AppError("Query parameters are required", 400);
  }

  const { page, limit, search, status, sortBy, sortOrder } = query;

  const postLookupMatch: Record<string, unknown> = {};

  if (status) postLookupMatch.status = status;

  if (search) {
    postLookupMatch.$or = [
      { "apartment.name": { $regex: search, $options: "i" } },
      { "apartment.city": { $regex: search, $options: "i" } },
      { planName: { $regex: search, $options: "i" } },
      { razorpayPaymentId: { $regex: search, $options: "i" } },
      { razorpaySubscriptionId: { $regex: search, $options: "i" } },
    ];
  }

  const sortStage = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "apartments",
        localField: "apartment",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1,
              city: 1,
              state: 1,
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

  const [paymentStatsResult, activeSubscribers] = await Promise.all([
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
  ]);

  const paymentStats = paymentStatsResult[0];

  return {
    totalRevenue: paymentStats?.totalRevenue ?? 0,
    revenueThisMonth: paymentStats?.revenueThisMonth ?? 0,
    totalTransactions: paymentStats?.totalTransactions ?? 0,
    activeSubscribers,
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
