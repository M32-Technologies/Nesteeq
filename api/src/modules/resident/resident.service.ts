import { AppError } from "../../utils/AppError.js";
import { ResidentListQuery } from "./resident.validation.js";
import { Resident } from "./resident.model.js";
import { Flat } from "../flat/flat.model.js";
import { syncFlatOccupancy } from "../flat/flat.service.js";
import { getAuthDB } from "../../config/auth-db.js";
import { Types } from "mongoose";
import { Invite } from "../invitation/invitation.model.js";

const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getResident = async (data: ResidentListQuery, apartmentId: string) => {
    const { search, page, blockId, residentType, status, limit } = data;

    if (!apartmentId) {
        throw new AppError("Apartment id is required", 400);
    }

    const filter: Record<string, any> = { apartmentId };

    if (residentType) filter.residentType = residentType;
    if (status) filter.status = status;
    if (blockId) {
        const flats = await Flat.find({ apartmentId, blockId }).select("_id").lean();
        filter.flatId = { $in: flats.map((flat) => flat._id) };
    }

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        const [users, flats] = await Promise.all([
            getAuthDB()
                .collection("user")
                .find({
                    $or: [
                        { name: regex },
                        { email: regex },
                    ],
                })
                .project({ _id: 0, id: 1 })
                .toArray(),
            Flat.find({
                apartmentId,
                flatNumber: regex,
            }).select("_id").lean(),
        ]);

        filter.$or = [
            { phoneNumber: regex },
            { userId: { $in: users.map((user) => user.id).filter(Boolean) } },
            { flatId: { $in: flats.map((flat) => flat._id) } },
        ];
    }

    const Page = Number(page) || 1;
    const Limit = Number(limit) || 10;
    const Skip = (Page - 1) * Limit;

    const [residents, totalCount] = await Promise.all([
        Resident.find(filter)
            .populate("flatId")
            .skip(Skip)
            .limit(Limit)
            .sort({ createdAt: -1 })
            .lean(),
        Resident.countDocuments(filter),
    ]);

    const users = await getAuthDB()
        .collection("user")
        .find({
            id: { $in: residents.map((resident) => resident.userId).filter(Boolean) },
        })
        .project({
            _id: 0,
            id: 1,
            name: 1,
            email: 1,
            emailVerified: 1,
            image: 1,
            role: 1,
            phone: 1,
        })
        .toArray();

    const usersById = new Map(users.map((user) => [user.id, user]));

    return {
        residents: residents.map((resident) => {
            const user = resident.userId ? usersById.get(resident.userId) : null;

            return {
                id: resident._id.toString(),
                apartmentId: resident.apartmentId.toString(),
                userId: resident.userId,
                name: user?.name ?? "Unknown user",
                email: user?.email ?? null,
                emailVerified: user?.emailVerified ?? false,
                image: user?.image ?? null,
                role: user?.role ?? resident.residentType,
                residentType: resident.residentType,
                phone: resident.phoneNumber ?? user?.phone ?? null,
                status: resident.status,
                flat: resident.flatId,
                joinedAt: resident.joinedAt,
                createdAt: resident.createdAt,
                updatedAt: resident.updatedAt,
            };
        }),
        page: Page,
        limit: Limit,
        totalPages: Math.ceil(totalCount / Limit),
        totalCount,
    };
}

export const getResidentStats = async (apartmentId: string) => {
    if (!apartmentId) {
        throw new AppError("Apartment id is required", 400);
    }

    const [residentAgg, pendingInvites] = await Promise.all([
        Resident.aggregate([
            { $match: { apartmentId: new Types.ObjectId(apartmentId) } },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    active: [{ $match: { status: "active" } }, { $count: "count" }],
                    inactive: [{ $match: { status: "inactive" } }, { $count: "count" }],
                },
            },
        ]),
        Invite.countDocuments({
            apartmentId: new Types.ObjectId(apartmentId),
            role: { $in: ["owner", "resident"] },
            status: "pending",
        }),
    ]);

    const facet = residentAgg[0] ?? {};

    return {
        totalUsers: facet.total?.[0]?.count ?? 0,
        activeUsers: facet.active?.[0]?.count ?? 0,
        inactiveUsers: facet.inactive?.[0]?.count ?? 0,
        pendingUsers: pendingInvites,
    };
};

export const getResidentDetails = async (residentId: string, apartmentId: string) => {
    if (!apartmentId) {
        throw new AppError("Apartment id is required", 400);
    }

    if (!Types.ObjectId.isValid(residentId)) {
        throw new AppError("Resident id must be a valid id", 400);
    }

    const resident = await Resident.findOne({
        _id: new Types.ObjectId(residentId),
        apartmentId,
    })
        .populate("flatId")
        .lean();

    if (!resident) {
        throw new AppError("Resident not found", 404);
    }

    const user = resident.userId
        ? await getAuthDB()
            .collection("user")
            .findOne(
                { id: resident.userId },
                {
                    projection: {
                        _id: 0,
                        id: 1,
                        name: 1,
                        email: 1,
                        emailVerified: 1,
                        image: 1,
                        role: 1,
                        phone: 1,
                    },
                }
            )
        : null;

    return {
        id: resident._id.toString(),
        apartmentId: resident.apartmentId.toString(),
        userId: resident.userId,
        name: user?.name ?? "Unknown user",
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        image: user?.image ?? null,
        role: user?.role ?? resident.residentType,
        residentType: resident.residentType,
        phone: resident.phoneNumber ?? user?.phone ?? null,
        status: resident.status,
        flat: resident.flatId,
        joinedAt: resident.joinedAt,
        createdAt: resident.createdAt,
        updatedAt: resident.updatedAt,
    };
}

export const updateResidentStatus = async (
    residentId: string,
    apartmentId: string,
    status: unknown
) => {
    if (!apartmentId) {
        throw new AppError("Apartment id is required", 400);
    }

    if (!Types.ObjectId.isValid(residentId)) {
        throw new AppError("Resident id must be a valid id", 400);
    }

    if (status !== "active" && status !== "inactive") {
        throw new AppError("Status must be active or inactive", 400);
    }

    const resident = await Resident.findOne({
        _id: new Types.ObjectId(residentId),
        apartmentId,
    });

    if (!resident) {
        throw new AppError("Resident not found", 404);
    }

    const wasActive = resident.status === "active";
    const flatId = new Types.ObjectId(resident.flatId.toString());
    const apartmentObjectId = new Types.ObjectId(apartmentId);

    resident.status = status;
    await resident.save();

    if (wasActive || status === "active") {
        await syncFlatOccupancy(flatId, apartmentObjectId);
    }

    return {
        id: resident._id.toString(),
        status: resident.status,
        updatedAt: resident.updatedAt,
    };
}

export const updateResidentDetails = async (
    residentId: string,
    apartmentId: string,
    data: Record<string, unknown>
) => {
    if (!apartmentId) {
        throw new AppError("Apartment id is required", 400);
    }
    
    if (!Types.ObjectId.isValid(residentId)) {
        throw new AppError("Resident id must be a valid id", 400);
    }

    if ("email" in data) {
        throw new AppError("Email cannot be changed", 400);
    }

    const resident = await Resident.findOne({
        _id: new Types.ObjectId(residentId),
        apartmentId,
    });
    
    if (!resident) {
        throw new AppError("Resident not found", 404);
    }

    const apartmentObjectId = new Types.ObjectId(apartmentId);
    const previousFlatId = new Types.ObjectId(resident.flatId.toString());
    const previousResidentType = resident.residentType;

    if (data.residentType !== undefined) {
        if (data.residentType !== "owner" && data.residentType !== "resident") {
            throw new AppError("Resident type must be owner or resident", 400);
        }

        resident.residentType = data.residentType;
    }

    if (data.phone !== undefined) {
        if (data.phone !== null && typeof data.phone !== "string") {
            throw new AppError("Phone must be a string or null", 400);
        }

        resident.phoneNumber = data.phone?.trim() || null;
    }

    if (data.flatId !== undefined) {
        if (typeof data.flatId !== "string" || !Types.ObjectId.isValid(data.flatId)) {
            throw new AppError("Flat id must be a valid id", 400);
        }

        const flat = await Flat.findOne({
            _id: new Types.ObjectId(data.flatId),
            apartmentId,
        }).select("_id").lean();

        if (!flat) {
            throw new AppError("Flat not found in this apartment", 404);
        }

        resident.flatId = flat._id;
    }

    if (data.name !== undefined) {
        if (typeof data.name !== "string" || data.name.trim().length < 2) {
            throw new AppError("Name must contain at least 2 characters", 400);
        }

        if (resident.userId) {
            await getAuthDB()
                .collection("user")
                .updateOne(
                    { id: resident.userId },
                    { $set: { name: data.name.trim() } }
                );
        }
    }

    await resident.save();

    const currentFlatId = new Types.ObjectId(resident.flatId.toString());
    const flatChanged = previousFlatId.toString() !== currentFlatId.toString();
    const residentTypeChanged = previousResidentType !== resident.residentType;

    if (resident.status === "active" && (flatChanged || residentTypeChanged)) {
        await Promise.all([
            flatChanged
                ? syncFlatOccupancy(previousFlatId, apartmentObjectId)
                : Promise.resolve(),
            syncFlatOccupancy(currentFlatId, apartmentObjectId),
        ]);
    }

    return getResidentDetails(resident._id.toString(), apartmentId);
}
