import { AppError } from "../../../utils/AppError.js";
import { PipelineStage, Types } from "mongoose";
import { GetAllApartmentsQuery, ApartmentAnalyticsQuery } from "../validation/apartment.validation.js";
import { Apartment } from "../../apartment/apartment.model.js";
import { Subscription } from "../../subscription/subscription.model.js";
import { getAuthDB } from "../../../config/auth-db.js";
import { AuthUserDoc, ApartmentStats, MonthlyRegistration, ApartmentAnalyticsData } from "../types.js";

export const getAllApartment = async (query: GetAllApartmentsQuery) => {
    if (!query) {
        throw new AppError("Query parameters are required", 400);
    }

    const { page, limit, search, status, city, state, sortBy, sortOrder } = query;

    const match: Record<string, unknown> = {};

    if (status) match.status = status;
    if (city) match.city = { $regex: `^${city}$`, $options: "i" };
    if (state) match.state = { $regex: `^${state}$`, $options: "i" };

    if (search) {
        match.$or = [
            { name: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
        ];
    }

    const sortStage = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
        { $match: match },
        {
            $lookup: {
                from: "subscriptions",
                let: { apartmentId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$apartment", "$$apartmentId"] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                ],
                as: "currentSubscription",
            },
        },
        {
            $unwind: {
                path: "$currentSubscription",
                preserveNullAndEmptyArrays: true, // apartments still pending_payment have none yet
            },
        },
        {
            $project: {
                name: 1,
                city: 1,
                state: 1,
                address: 1,
                status: 1,
                totalUnits: 1,
                totalBlocks: 1,
                totalFloors: 1,
                parkingSlots: 1,
                contactNumber: 1,
                createdAt: 1,
                updatedAt: 1,
                "currentSubscription.status": 1,
                "currentSubscription.planSnapshot": 1,
                "currentSubscription.currentStart": 1,
                "currentSubscription.currentEnd": 1,
                "currentSubscription.cancelAtCycleEnd": 1,
            },
        },
        {
            $facet: {
                data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: "count" }],
            },
        },
    ];

    const result = await Apartment.aggregate(pipeline);
    if (!result) {
        throw new AppError("Failed to fetch apartments", 500);
    }
    const data = result[0]?.data ?? [];
    const total = result[0]?.totalCount?.[0]?.count ?? 0;

    return {
        apartments: data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}


export const getSingleApartment = async (apartmentId: string) => {
    if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
        throw new AppError("Invalid apartment ID", 400);
    }

    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
        throw new AppError("Apartment not found", 404);
    }
    let managerId = new Types.ObjectId(apartment.managerId)
    let user: AuthUserDoc | null = null;
    if (apartment.managerId) {
        const authDb = getAuthDB();
        user = await authDb.collection<AuthUserDoc>("user").findOne(
            { _id: managerId },
            {
                projection: {
                    password: 0,
                },
            }
        );
    }

    const currentSubscription = await Subscription.findOne({ apartment: apartment._id })
        .sort({ createdAt: -1 })
        .lean();

    return {
        ...apartment.toObject(),
        user: user ?? null,
        currentSubscription: currentSubscription ?? null,
    };
};

export const updateStatusApartment = async (apartmentId: string, status: string) => {
    
    if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
        throw new AppError("Invalid apartment ID", 400);
    }

    const apartment = await Apartment.findById(apartmentId);

    if (!apartment) {
        throw new AppError("Apartment not found", 404);
    }

    if (apartment.status === status) {
        throw new AppError(
            `Apartment is already ${status}`,
            400
        );
    }

    apartment.status = status;
    await apartment.save();

    return apartment.toObject();
};

export const getApartmentStats = async (): Promise<ApartmentStats> => {
    const [stats] = await Apartment.aggregate<ApartmentStats>([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "active"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                pending_payment: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "pending_payment"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
                inactive: {
                    $sum: {
                        $cond: {
                            if: { $eq: ["$status", "inactive"] },
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
                active: 1,
                pending_payment: 1,
                inactive: 1,
            },
        },
    ]);

    return {
        total: stats?.total ?? 0,
        active: stats?.active ?? 0,
        pending_payment: stats?.pending_payment ?? 0,
        inactive: stats?.inactive ?? 0,
    };
};

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const getApartmentAnalytics = async (
    query?: Partial<ApartmentAnalyticsQuery>
): Promise<ApartmentAnalyticsData> => {
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

    // 1st day of the starting month at 00:00:00.000 UTC
    const startDate = new Date(Date.UTC(currentYear, currentMonth - (numMonths - 1), 1, 0, 0, 0, 0));

    const aggregatedResults = await Apartment.aggregate<{ _id: string; count: number }>([
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

    const registrations: MonthlyRegistration[] = [];
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
        const year = d.getUTCFullYear();
        const monthIndex = d.getUTCMonth();
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        const period = `${MONTH_NAMES[monthIndex]} ${year}`;

        registrations.push({
            period,
            count: countMap.get(key) ?? 0,
        });
    }

    return {
        range,
        interval: "month",
        registrations,
    };
};

