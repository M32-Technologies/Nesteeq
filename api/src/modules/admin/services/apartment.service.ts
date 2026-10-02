import { AppError } from "../../../utils/AppError.js";
import { PipelineStage, Types } from "mongoose";
import { GetAllApartmentsQuery, ApartmentAnalyticsQuery } from "../validation/apartment.validation.js";
import { Apartment } from "../../apartment/apartment.model.js";
import { Subscription } from "../../subscription/subscription.model.js";
import { Staff } from "../../staff/staff.model.js";
import { emailService } from "../../../services/EmailService.js";
import { env } from "../../../config/env.js";
import { ObjectId } from "mongodb";
import { getAuthDB } from "../../../config/auth-db.js";
import { escapeRegExp } from "../../../utils/regex.js";
import { AuthUserDoc, ApartmentStats, MonthlyRegistration, ApartmentAnalyticsData } from "../types.js";
import { emitApartmentStatusChanged } from "../../../socket/socket.js";
import { getCurrentApartment } from "../../apartment/apartment.service.js";

export const getAllApartment = async (query: GetAllApartmentsQuery) => {
    if (!query) {
        throw new AppError("Query parameters are required", 400);
    }

    const { page, limit, search, status, city, state, sortBy, sortOrder } = query;

    const match: Record<string, unknown> = {};

    if (status) match.status = status;
    if (city) match.city = { $regex: `^${escapeRegExp(city)}$`, $options: "i" };
    if (state) match.state = { $regex: `^${escapeRegExp(state)}$`, $options: "i" };

    if (search) {
        const safeSearch = escapeRegExp(search);
        match.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { address: { $regex: safeSearch, $options: "i" } },
            { city: { $regex: safeSearch, $options: "i" } },
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
    const apartment = await getCurrentApartment(apartmentId);
    let user: AuthUserDoc | null = null;
    const authDb = getAuthDB();

    if (apartment.managerId) {
        const managerFilters: Record<string, unknown>[] = [{ id: apartment.managerId }];
        if (ObjectId.isValid(apartment.managerId)) {
            managerFilters.push({ _id: new ObjectId(apartment.managerId) });
        }
        user = await authDb.collection<AuthUserDoc>("user").findOne(
            { $or: managerFilters },
            {
                projection: {
                    password: 0,
                },
            }
        );
    }

    if (!user && apartment._id) {
        user = await authDb.collection<AuthUserDoc>("user").findOne(
            {
                apartmentId: apartment._id.toString(),
                role: { $in: ["property_manager", "propertymanager", "manager"] },
            },
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

const notifyApartmentManagersStatusChange = async (
    apartment: { _id: Types.ObjectId; managerId: string; name: string },
    newStatus: "active" | "inactive",
    reason?: string
) => {
    try {
        const candidateUserIds = new Set<string>();
        if (apartment.managerId) {
            candidateUserIds.add(apartment.managerId.toString());
        }
        try {
            const staffManagers = await Staff.find({
                apartmentId: apartment._id,
                role: "property_manager",
                status: "active",
            }).select("userId").lean();

            for (const staff of staffManagers) {
                if (staff.userId) {
                    candidateUserIds.add(staff.userId.toString());
                }
            }
        } catch (err) {
            console.error("[notifyApartmentManagersStatusChange] Error querying staff property managers:", err);
        }

        if (candidateUserIds.size === 0) {
            return;
        }
        const authDb = getAuthDB();
        const userFilters: Record<string, unknown>[] = [];
        for (const userId of candidateUserIds) {
            userFilters.push({ id: userId });
            if (ObjectId.isValid(userId)) {
                userFilters.push({ _id: new ObjectId(userId) });
            }
        }

        const users = await authDb
            .collection<AuthUserDoc>("user")
            .find({ $or: userFilters }, { projection: { email: 1, name: 1 } })
            .toArray();

        for (const user of users) {
            if (!user.email) continue;
            const managerName = user.name || "Property Manager";

            try {
                if (newStatus === "inactive") {
                    await emailService.sendApartmentDeactivated(user.email, {
                        managerName,
                        apartmentName: apartment.name,
                        reason,
                    });
                } else if (newStatus === "active") {
                    await emailService.sendApartmentReactivated(user.email, {
                        managerName,
                        apartmentName: apartment.name,
                    });
                }
            } catch (err) {
                console.error(`[notifyApartmentManagersStatusChange] Failed to send ${newStatus} email to manager ${user.email}:`, err);
            }
        }
    } catch (error) {
        console.error("[notifyApartmentManagersStatusChange] Error processing manager notifications:", error);
    }
};

export const updateStatusApartment = async (apartmentId: string, status: string, reason?: string) => {
    
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
    if (status === "inactive") {
        apartment.inactiveReason = reason?.trim() || "Temporarily deactivated by administrator.";
    } else if (status === "active") {
        apartment.inactiveReason = undefined;
    }
    await apartment.save();

    emitApartmentStatusChanged(apartment._id.toString(), {
        apartmentId: apartment._id.toString(),
        status: status as "active" | "inactive",
        reason: apartment.inactiveReason,
        apartmentName: apartment.name,
    });

    if (status === "inactive" || status === "active") {
        void notifyApartmentManagersStatusChange(
            {
                _id: apartment._id,
                managerId: apartment.managerId,
                name: apartment.name,
            },
            status as "active" | "inactive",
            apartment.inactiveReason
        );
    }

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

