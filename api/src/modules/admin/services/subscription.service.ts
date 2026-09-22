import { AppError } from "../../../utils/AppError.js";
import { PipelineStage, Types } from "mongoose";
import { GetAllSubscriptionsQuery, SubscriptionAnalyticsQuery } from "../validation/subscription.validation.js";
import { Subscription } from "../../subscription/subscription.model.js";
import { SubscriptionStats, MonthlyRegistration, SubscriptionAnalyticsData } from "../types.js";

export const getAllSubscriptions = async (query: GetAllSubscriptionsQuery) => {
    if (!query) {
        throw new AppError("Query parameters are required", 400);
    }

    const { page, limit, search, status, plan, sortBy, sortOrder } = query;

    const postLookupMatch: Record<string, unknown> = {};

    if (status) postLookupMatch.status = status;
    if (plan) postLookupMatch["planSnapshot.planName"] = { $regex: plan, $options: "i" };

    if (search) {
        postLookupMatch.$or = [
            { "apartment.name": { $regex: search, $options: "i" } },
            { "apartment.city": { $regex: search, $options: "i" } },
            { "planSnapshot.planName": { $regex: search, $options: "i" } },
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
                planSnapshot: 1,
                status: 1,
                currentStart: 1,
                currentEnd: 1,
                chargeAt: 1,
                startAt: 1,
                endAt: 1,
                endedAt: 1,
                totalCount: 1,
                paidCount: 1,
                remainingCount: 1,
                isTrial: 1,
                trialEndsAt: 1,
                cancelledAt: 1,
                cancelReason: 1,
                cancelAtCycleEnd: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
        {
            $facet: {
                data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: "count" }],
            },
        },
    ];

    const result = await Subscription.aggregate(pipeline);
    if (!result) {
        throw new AppError("Failed to fetch subscriptions", 500);
    }

    const data = result[0]?.data ?? [];
    const total = result[0]?.totalCount?.[0]?.count ?? 0;

    return {
        subscriptions: data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
    const [stats] = await Subscription.aggregate<SubscriptionStats>([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                created: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "created"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                authenticated: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "authenticated"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                active: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "active"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                pending: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "pending"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                halted: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "halted"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                cancelled: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "cancelled"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                completed: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "completed"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                expired: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "expired"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                total: 1,
                created: 1,
                authenticated: 1,
                active: 1,
                pending: 1,
                halted: 1,
                cancelled: 1,
                completed: 1,
                expired: 1,
            },
        },
    ]);

    return {
        total: stats?.total ?? 0,
        created: stats?.created ?? 0,
        authenticated: stats?.authenticated ?? 0,
        active: stats?.active ?? 0,
        pending: stats?.pending ?? 0,
        halted: stats?.halted ?? 0,
        cancelled: stats?.cancelled ?? 0,
        completed: stats?.completed ?? 0,
        expired: stats?.expired ?? 0,
    };
};

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const getSubscriptionAnalytics = async (
    query?: Partial<SubscriptionAnalyticsQuery>
): Promise<SubscriptionAnalyticsData> => {
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

    const startDate = new Date(Date.UTC(currentYear, currentMonth - (numMonths - 1), 1, 0, 0, 0, 0));

    const aggregatedResults = await Subscription.aggregate<{ _id: string; count: number }>([
        {
            $match: {
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m",
                        date: "$createdAt",
                        timezone: "UTC",
                    },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const countMap = new Map<string, number>();
    for (const item of aggregatedResults) {
        if (item._id) {
            countMap.set(item._id, item.count);
        }
    }

    const subscriptions: MonthlyRegistration[] = [];
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
        const year = d.getUTCFullYear();
        const monthIndex = d.getUTCMonth();
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        const period = `${MONTH_NAMES[monthIndex]} ${year}`;

        subscriptions.push({
            period,
            count: countMap.get(key) ?? 0,
        });
    }

    return {
        range,
        interval: "month",
        subscriptions,
    };
};

export const getSingleSubscription = async (subscriptionId: string) => {
    if (!subscriptionId || !Types.ObjectId.isValid(subscriptionId)) {
        throw new AppError("Invalid subscription ID", 400);
    }

    const subscription = await Subscription.findById(subscriptionId)
        .populate("apartment", "name city state address status contactNumber")
        .lean();

    if (!subscription) {
        throw new AppError("Subscription not found", 404);
    }

    // Exclude Razorpay internal fields except razorpaySubscriptionId for admin cross-reference
    const {
        razorpayPlanId: _rpId,
        razorpayCustomerId: _rcId,
        notes: _notes,
        authAttempts: _aa,
        hasScheduledChanges: _hsc,
        scheduleChangeAt: _sca,
        ...cleaned
    } = subscription;

    return cleaned;
};
