import crypto from "crypto";
import QRCode from "qrcode";
import { AppError } from "../../utils/AppError.js";
import { ResidentListQuery, RegisterVehicleInput, CreateResidentGuestPassInput } from "./resident.validation.js";
import { Resident } from "./resident.model.js";
import { Vehicle } from "./vehicle.model.js";
import { ParkingSlotModel } from "../parking/parking.model.js";
import { GuestPassModel, GuestPassStatus } from "../visitors/visit.model.js";
import { hashGuestPassToken } from "../visitors/visit.service.js";
import { normalizeVehicleNumber } from "../parking/parking.service.js";
import { Flat } from "../flat/flat.model.js";
import { syncFlatOccupancy } from "../flat/flat.service.js";
import { getAuthDB } from "../../config/auth-db.js";
import mongoose, { Types } from "mongoose";
import { Invite } from "../invitation/invitation.model.js";
import { Complaint } from "../complaint/complaint.model.js";
import { Announcement } from "../announcements/announcements.model.js";

const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAuthUserFilter = (userId: string) => {
    const filters: Record<string, unknown>[] = [{ id: userId }];

    if (Types.ObjectId.isValid(userId)) {
        filters.push({ _id: new Types.ObjectId(userId) });
    }

    return { $or: filters };
};

const getAuthUsersFilter = (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const objectIds = uniqueIds
        .filter((userId) => Types.ObjectId.isValid(userId))
        .map((userId) => new Types.ObjectId(userId));

    return {
        $or: [
            { id: { $in: uniqueIds } },
            ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
        ],
    };
};

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
                .project({ _id: 1, id: 1 })
                .toArray(),
            Flat.find({
                apartmentId,
                flatNumber: regex,
            }).select("_id").lean(),
        ]);

        const matchedUserIds = (users as Array<{ _id?: { toString: () => string }; id?: string }>)
            .flatMap((user) => [user.id, user._id?.toString()])
            .filter(Boolean);

        filter.$or = [
            { phoneNumber: regex },
            { userId: { $in: matchedUserIds } },
            { flatId: { $in: flats.map((flat) => flat._id) } },
        ];
    }

    const Page = Number(page) || 1;
    const Limit = Number(limit) || 10;
    const Skip = (Page - 1) * Limit;

    const [residents, totalCount] = await Promise.all([
        Resident.find(filter)
            .populate({
                path: "flatId",
                populate: {
                    path: "blockId",
                    select: "blockname code",
                },
            })
            .skip(Skip)
            .limit(Limit)
            .sort({ createdAt: -1 })
            .lean(),
        Resident.countDocuments(filter),
    ]);

    const userIds = residents.map((resident) => resident.userId).filter(Boolean) as string[];
    const users = userIds.length
        ? await getAuthDB()
            .collection("user")
            .find(getAuthUsersFilter(userIds))
            .project({
                _id: 1,
                id: 1,
                name: 1,
                email: 1,
                emailVerified: 1,
                image: 1,
                role: 1,
                phone: 1,
            })
            .toArray()
        : [];

    const usersById = new Map<string, any>();
    for (const user of users) {
        if (user.id) usersById.set(user.id, user);
        if (user._id) usersById.set(user._id.toString(), user);
    }

    return {
        residents: residents.map((resident: any) => {
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
        .populate({
            path: "flatId",
            populate: {
                path: "blockId",
                select: "blockname code",
            },
        })
        .lean();

    if (!resident) {
        throw new AppError("Resident not found", 404);
    }

    const user = resident.userId
        ? await getAuthDB()
            .collection("user")
            .findOne(
                getAuthUserFilter(resident.userId),
                {
                    projection: {
                        _id: 1,
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

    await mongoose.connection.transaction(async (session) => {
        resident.status = status;
        await resident.save({ session });

        if (wasActive || status === "active") {
            await syncFlatOccupancy(flatId, apartmentObjectId, { session });
        }
    });

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
                    getAuthUserFilter(resident.userId),
                    { $set: { name: data.name.trim() } }
                );
        }
    }

    const currentFlatId = new Types.ObjectId(resident.flatId.toString());
    const flatChanged = previousFlatId.toString() !== currentFlatId.toString();
    const residentTypeChanged = previousResidentType !== resident.residentType;

    await mongoose.connection.transaction(async (session) => {
        await resident.save({ session });

        if (resident.status === "active" && (flatChanged || residentTypeChanged)) {
            await Promise.all([
                flatChanged
                    ? syncFlatOccupancy(previousFlatId, apartmentObjectId, { session })
                    : Promise.resolve(),
                syncFlatOccupancy(currentFlatId, apartmentObjectId, { session }),
            ]);
        }
    });

    return getResidentDetails(resident._id.toString(), apartmentId);
}

const resolveResidentContext = async (user: any, apartmentId?: string) => {
    const aptId = apartmentId || user.apartmentId;
    if (!aptId) {
        throw new AppError("Apartment context is required", 400);
    }

    let resident: any = null;
    if (Types.ObjectId.isValid(aptId)) {
        resident = await Resident.findOne({
            apartmentId: new Types.ObjectId(aptId),
            $or: [
                { userId: user.id },
                ...(Types.ObjectId.isValid(user.id) ? [{ _id: new Types.ObjectId(user.id) }] : []),
            ],
        }).lean();
    }

    if (!resident && user.flatId && Types.ObjectId.isValid(user.flatId)) {
        resident = await Resident.findOne({
            flatId: new Types.ObjectId(user.flatId),
        }).lean();
    }

    const flatId = resident?.flatId || (user.flatId && Types.ObjectId.isValid(user.flatId) ? new Types.ObjectId(user.flatId) : null);

    let flat: any = null;
    if (flatId) {
        flat = await Flat.findById(flatId).populate("blockId", "blockname code").lean();
    }

    return {
        apartmentId: aptId,
        resident,
        flatId: flatId ? flatId.toString() : null,
        flat,
    };
};

export const getMyVehiclesAndParkingService = async (user: any, apartmentId?: string) => {
    const { apartmentId: aptId, resident, flatId, flat } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    // 1. Fetch registered vehicles
    const vehicleConditions: any[] = [{ apartmentId: aptObjectId }];
    if (flatId && Types.ObjectId.isValid(flatId)) {
        vehicleConditions.push({ flatId: new Types.ObjectId(flatId) });
    } else if (resident?._id) {
        vehicleConditions.push({ residentId: resident._id });
    } else {
        vehicleConditions.push({ userId: user.id });
    }

    const vehicles = await Vehicle.find({
        apartmentId: aptObjectId,
        $or: vehicleConditions.slice(1).length ? vehicleConditions.slice(1) : [{ userId: user.id }],
    })
        .sort({ createdAt: -1 })
        .lean();

    // 2. Fetch assigned parking slots from ParkingSlotModel for this flat/resident
    const slotConditions: any[] = [];
    if (flatId && Types.ObjectId.isValid(flatId)) {
        slotConditions.push({ flatId: new Types.ObjectId(flatId) });
    }
    if (resident?._id) {
        slotConditions.push({ residentId: resident._id });
    }

    let assignedSlots: any[] = [];
    if (slotConditions.length > 0) {
        assignedSlots = await ParkingSlotModel.find({
            apartmentId: aptObjectId,
            $or: slotConditions,
        }).lean();
    }

    const registeredSlotIds = new Set(
        vehicles.filter((v: any) => v.parkingSlotId).map((v: any) => v.parkingSlotId.toString())
    );

    // 3. Compute Guest Parking Quota (2 Slots / Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let monthlyPassesCount = 0;
    if (flatId && Types.ObjectId.isValid(flatId)) {
        monthlyPassesCount = await GuestPassModel.countDocuments({
            apartmentId: aptObjectId,
            flatId: new Types.ObjectId(flatId),
            createdAt: { $gte: startOfMonth },
        });
    }

    const monthlyQuota = 2;
    const remainingQuota = Math.max(0, monthlyQuota - monthlyPassesCount);

    const flatUnitName = flat?.flatNumber
        ? `${(flat.blockId as any)?.blockname ? `${(flat.blockId as any).blockname} • ` : ""}Flat ${flat.flatNumber}`
        : "Assigned Unit";

    return {
        vehicles: vehicles.map((v: any) => ({
            _id: v._id.toString(),
            vehicleNumber: v.vehicleNumber,
            vehicleType: v.vehicleType,
            makeModel: v.makeModel || "Not specified",
            color: v.color || "Standard",
            rfidTag: v.rfidTag || `NST-${v._id.toString().slice(-6).toUpperCase()}`,
            parkingSlotId: v.parkingSlotId ? v.parkingSlotId.toString() : null,
            status: v.status || "ACTIVE",
            evChargingRequired: Boolean(v.evChargingRequired),
            notes: v.notes || null,
            createdAt: v.createdAt,
        })),
        assignedSlots: assignedSlots.map((s: any) => {
            const isRegistered = Boolean(s.vehicleNumber) || registeredSlotIds.has(s._id.toString());
            return {
                _id: s._id.toString(),
                slotNumber: s.slotNumber,
                level: s.level,
                zoneName: s.zoneName || null,
                zoneCode: s.zoneCode || null,
                prefix: s.prefix,
                vehicleType: s.vehicleType,
                status: s.status,
                vehicleNumber: s.vehicleNumber || null,
                isRegistered,
            };
        }),
        totalSlotsAssigned: assignedSlots.length,
        availableSlotsCount: assignedSlots.filter(
            (s: any) => !s.vehicleNumber && !registeredSlotIds.has(s._id.toString())
        ).length,
        availableSlots: assignedSlots
            .filter((s: any) => !s.vehicleNumber && !registeredSlotIds.has(s._id.toString()))
            .map((s: any) => ({
                _id: s._id.toString(),
                slotNumber: s.slotNumber,
                level: s.level,
                zoneName: s.zoneName || null,
                zoneCode: s.zoneCode || null,
                prefix: s.prefix,
                vehicleType: s.vehicleType,
                status: s.status,
                vehicleNumber: null,
                isRegistered: false,
            })),
        isSlotLimitReached: assignedSlots.length > 0 && assignedSlots.filter(
            (s: any) => !s.vehicleNumber && !registeredSlotIds.has(s._id.toString())
        ).length === 0,
        flatUnitName,
        guestQuota: {
            monthlyTotal: monthlyQuota,
            usedThisMonth: monthlyPassesCount,
            remaining: remainingQuota,
        },
        rfidClearanceActive: true,
    };
};

export const registerVehicleService = async (
    user: any,
    data: RegisterVehicleInput,
    apartmentId?: string
) => {
    const { apartmentId: aptId, resident, flatId } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    const normalizedNumber = normalizeVehicleNumber(data.vehicleNumber);

    // Check if vehicle is already registered in this apartment
    const existingVehicle = await Vehicle.findOne({
        apartmentId: aptObjectId,
        vehicleNumber: normalizedNumber,
    });

    if (existingVehicle) {
        throw new AppError(
            `Vehicle ${normalizedNumber} is already registered in this society`,
            409
        );
    }

    // Check if this vehicle is already allocated to any parking slot in this apartment
    const slotWithVehicle = await ParkingSlotModel.findOne({
        apartmentId: aptObjectId,
        vehicleNumber: normalizedNumber,
    });

    if (slotWithVehicle) {
        throw new AppError(
            `Vehicle ${normalizedNumber} is already allocated to parking slot ${slotWithVehicle.slotNumber}`,
            409
        );
    }

    // Check assigned slots for this flat/resident
    const slotConditions: any[] = [];
    if (flatId && Types.ObjectId.isValid(flatId)) {
        slotConditions.push({ flatId: new Types.ObjectId(flatId) });
    }
    if (resident?._id) {
        slotConditions.push({ residentId: resident._id });
    }

    const assignedSlots = slotConditions.length
        ? await ParkingSlotModel.find({
              apartmentId: aptObjectId,
              $or: slotConditions,
          })
        : [];

    if (assignedSlots.length === 0) {
        throw new AppError(
            "No parking slot has been assigned to your unit by the property manager. Please contact management.",
            403
        );
    }

    // Find all vehicles currently registered for this flat/resident to know which slots are occupied
    const activeVehicles = await Vehicle.find({
        apartmentId: aptObjectId,
        $or: slotConditions.length ? slotConditions : [{ userId: user.id }],
    }).lean();

    const usedSlotIds = new Set(
        activeVehicles
            .filter((v: any) => v.parkingSlotId)
            .map((v: any) => v.parkingSlotId.toString())
    );
    assignedSlots.forEach((s) => {
        if (s.vehicleNumber) {
            usedSlotIds.add(s._id.toString());
        }
    });

    // Target slot selection
    let targetSlot: any = null;
    if (data.slotId) {
        targetSlot = assignedSlots.find((s) => s._id.toString() === data.slotId);
        if (!targetSlot) {
            throw new AppError("The selected parking slot is not assigned to your unit.", 403);
        }
        if (usedSlotIds.has(targetSlot._id.toString())) {
            throw new AppError("The selected parking slot already has a vehicle registered.", 400);
        }
    } else {
        targetSlot = assignedSlots.find((s) => !usedSlotIds.has(s._id.toString()));
        if (!targetSlot) {
            throw new AppError(
                `All assigned parking slots (${assignedSlots.length}) already have a vehicle registered. If you need another slot, please contact the property manager.`,
                403
            );
        }
    }

    // Assign vehicle type strictly from the property manager's parking slot
    const assignedVehicleType = targetSlot.vehicleType || "CAR";

    const rfidTag =
        data.rfidTag?.trim() ||
        `NST-RFID-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Update slot vehicleNumber
    targetSlot.vehicleNumber = normalizedNumber;
    await targetSlot.save();

    const newVehicle = await Vehicle.create({
        apartmentId: aptObjectId,
        residentId: resident?._id || (Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : undefined),
        flatId: flatId && Types.ObjectId.isValid(flatId) ? new Types.ObjectId(flatId) : undefined,
        userId: user.id,
        vehicleNumber: normalizedNumber,
        vehicleType: assignedVehicleType,
        makeModel: data.makeModel?.trim() || null,
        color: data.color?.trim() || null,
        rfidTag,
        parkingSlotId: targetSlot._id,
        evChargingRequired: Boolean(data.evChargingRequired),
        notes: data.notes?.trim() || null,
        status: "ACTIVE",
    });

    return newVehicle;
};

export const deleteVehicleService = async (
    user: any,
    vehicleId: string,
    apartmentId?: string
) => {
    const { apartmentId: aptId, resident, flatId } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    if (!Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400);
    }

    const vehicle = await Vehicle.findOne({
        _id: new Types.ObjectId(vehicleId),
        apartmentId: aptObjectId,
    });

    if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
    }

    const isOwner =
        (vehicle.userId && vehicle.userId === user.id) ||
        (resident?._id && vehicle.residentId && vehicle.residentId.toString() === resident._id.toString()) ||
        (flatId && vehicle.flatId && vehicle.flatId.toString() === flatId.toString());

    if (!isOwner) {
        throw new AppError("You are not authorized to unregister this vehicle", 403);
    }

    // Clear vehicle number on associated slot
    if (vehicle.parkingSlotId) {
        await ParkingSlotModel.updateOne(
            { _id: vehicle.parkingSlotId },
            { $set: { vehicleNumber: null } }
        );
    }

    await Vehicle.deleteOne({ _id: vehicle._id });

    return { success: true, message: `Vehicle ${vehicle.vehicleNumber} unregistered successfully` };
};

export const createResidentGuestPassService = async (
    user: any,
    data: CreateResidentGuestPassInput,
    apartmentId?: string
) => {
    const { apartmentId: aptId, resident, flatId, flat } = await resolveResidentContext(user, apartmentId);
    if (data.flatId && flatId && data.flatId !== flatId.toString()) {
        throw new AppError("You are not authorized to create a guest pass for another flat", 403);
    }
    const targetFlatId = flatId || (data.flatId && Types.ObjectId.isValid(data.flatId) ? data.flatId : null);
    if (!targetFlatId) {
        throw new AppError("No valid flat found for this resident context", 400);
    }

    const now = new Date();
    const validFrom = data.validFrom ? new Date(data.validFrom) : now;
    let validUntil = data.validUntil ? new Date(data.validUntil) : null;

    if (!validUntil) {
        const hours = data.durationHours && data.durationHours > 0 ? data.durationHours : 8;
        validUntil = new Date(validFrom.getTime() + hours * 60 * 60 * 1000);
    }

    if (validUntil <= validFrom) {
        throw new AppError("Guest pass expiry must be later than start time", 400);
    }
    if (validUntil <= now) {
        throw new AppError("Guest pass expiry must be in the future", 400);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashGuestPassToken(rawToken);
    const qrCodeDataUrl = await QRCode.toDataURL(rawToken, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
    });

    const pass = await GuestPassModel.create({
        apartmentId: new Types.ObjectId(aptId),
        createdByResidentId: resident?._id || new Types.ObjectId(user.id),
        flatId: new Types.ObjectId(targetFlatId),
        visitorName: data.visitorName.trim(),
        visitorPhone: data.visitorPhone?.trim() || null,
        purpose: data.purpose?.trim() || null,
        vehicleNumber: data.vehicleNumber ? normalizeVehicleNumber(data.vehicleNumber) : null,
        vehicleType: data.vehicleType ? data.vehicleType.toUpperCase() : null,
        rawToken,
        qrCodeDataUrl,
        tokenHash,
        validFrom,
        validUntil,
        status: GuestPassStatus.ACTIVE,
    });

    const flatNumber = flat?.flatNumber || null;
    const passObj = pass.toObject();
    delete (passObj as any).tokenHash;

    return {
        guestPass: {
            ...passObj,
            _id: pass._id.toString(),
            id: pass._id.toString(),
            token: rawToken,
            qrCodeDataUrl,
            flatNumber,
        },
        token: rawToken,
        qrCodeDataUrl,
    };
};

export const getResidentGuestPassesService = async (
    user: any,
    query: { status?: string; page?: number; limit?: number; search?: string },
    apartmentId?: string
) => {
    const { apartmentId: aptId, resident, flatId, flat } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    // Auto-expire old active passes
    const now = new Date();
    await GuestPassModel.updateMany(
        {
            apartmentId: aptObjectId,
            status: GuestPassStatus.ACTIVE,
            validUntil: { $lt: now },
            $or: [
                ...(flatId ? [{ flatId: new Types.ObjectId(flatId) }] : []),
                ...(resident?._id ? [{ createdByResidentId: resident._id }] : []),
            ],
        },
        { $set: { status: GuestPassStatus.EXPIRED } }
    );

    const conditions: Record<string, unknown>[] = [
        { apartmentId: aptObjectId },
    ];

    const ownerFilter: Record<string, unknown>[] = [];
    if (flatId && Types.ObjectId.isValid(flatId)) {
        ownerFilter.push({ flatId: new Types.ObjectId(flatId) });
    }
    if (resident?._id) {
        ownerFilter.push({ createdByResidentId: resident._id });
    }
    if (ownerFilter.length > 0) {
        conditions.push({ $or: ownerFilter });
    }

    if (query.status && query.status !== "ALL") {
        conditions.push({ status: query.status });
    }

    if (query.search?.trim()) {
        const regex = new RegExp(escapeRegex(query.search.trim()), "i");
        conditions.push({
            $or: [
                { visitorName: regex },
                { purpose: regex },
                { vehicleNumber: regex },
                { visitorPhone: regex },
            ],
        });
    }

    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const baseConditions = conditions.filter((c) => !("status" in c));
    const baseFilter = baseConditions.length > 1 ? { $and: baseConditions } : baseConditions[0] || {};

    const [passes, total, activePassesCount, usedPassesCount, expiredPassesCount] = await Promise.all([
        GuestPassModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        GuestPassModel.countDocuments(filter),
        GuestPassModel.countDocuments({ ...baseFilter, status: GuestPassStatus.ACTIVE }),
        GuestPassModel.countDocuments({ ...baseFilter, status: GuestPassStatus.USED }),
        GuestPassModel.countDocuments({ ...baseFilter, status: GuestPassStatus.EXPIRED }),
    ]);

    const flatNumber = flat?.flatNumber || null;

    const items = passes.map((p: any) => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        apartmentId: p.apartmentId.toString(),
        flatId: p.flatId.toString(),
        flatNumber,
        visitorName: p.visitorName,
        visitorPhone: p.visitorPhone || null,
        purpose: p.purpose || null,
        vehicleNumber: p.vehicleNumber || null,
        vehicleType: p.vehicleType || null,
        status: p.status,
        validFrom: p.validFrom,
        validUntil: p.validUntil,
        token: p.rawToken || null,
        qrCodeDataUrl: p.qrCodeDataUrl || null,
        usedAt: p.usedAt || null,
        createdAt: p.createdAt,
    }));

    return {
        guestPasses: items,
        counts: {
            total,
            activePassesCount,
            usedPassesCount,
            expiredPassesCount,
        },
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};

export const cancelResidentGuestPassService = async (
    user: any,
    passId: string,
    apartmentId?: string
) => {
    const { apartmentId: aptId, resident, flatId } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    if (!Types.ObjectId.isValid(passId)) {
        throw new AppError("Invalid pass ID", 400);
    }

    const pass = await GuestPassModel.findOne({
        _id: new Types.ObjectId(passId),
        apartmentId: aptObjectId,
        $or: [
            ...(flatId ? [{ flatId: new Types.ObjectId(flatId) }] : []),
            ...(resident?._id ? [{ createdByResidentId: resident._id }] : []),
        ],
    });

    if (!pass) {
        throw new AppError("Visitor pass not found", 404);
    }

    if (pass.status === GuestPassStatus.CANCELLED) {
        throw new AppError("Pass is already cancelled", 400);
    }
    if (pass.status === GuestPassStatus.USED) {
        throw new AppError("Used passes cannot be cancelled", 400);
    }
    if (pass.status === GuestPassStatus.EXPIRED) {
        throw new AppError("Expired passes cannot be cancelled", 400);
    }

    pass.status = GuestPassStatus.CANCELLED;
    await pass.save();

    return {
        success: true,
        message: "Visitor pass cancelled successfully",
        guestPass: {
            _id: pass._id.toString(),
            status: pass.status,
        },
    };
};

export const getCurrentResidentProfileService = async (user: any, apartmentId?: string) => {
    const { apartmentId: aptId, resident, flat } = await resolveResidentContext(user, apartmentId);

    const authDb = getAuthDB();
    let authUser: any = null;
    if (user?.id) {
        authUser = await authDb.collection("user").findOne(getAuthUserFilter(user.id));
    }

    const flatInfo = flat
        ? {
            _id: flat._id.toString(),
            flatNumber: flat.flatNumber,
            floorNumber: flat.floorNumber,
            occupancyStatus: flat.occupancyStatus,
            blockId: flat.blockId
                ? {
                    _id: (flat.blockId as any)._id?.toString() || (flat.blockId as any).id,
                    blockname: (flat.blockId as any).blockname,
                    code: (flat.blockId as any).code,
                }
                : null,
        }
        : null;

    return {
        id: resident ? resident._id.toString() : user.id,
        _id: resident ? resident._id.toString() : user.id,
        apartmentId: aptId,
        userId: user.id,
        name: authUser?.name || user.name || "Resident",
        email: authUser?.email || user.email || null,
        role: user.role || "resident",
        residentType: resident?.residentType || "resident",
        phone: authUser?.phoneNumber || resident?.phone || null,
        status: resident?.status || "active",
        flat: flatInfo,
        joinedAt: resident?.createdAt || authUser?.createdAt || new Date().toISOString(),
    };
};

export const getResidentDashboardFeedService = async (user: any, apartmentId?: string) => {
    const { apartmentId: aptId, resident, flatId, flat } = await resolveResidentContext(user, apartmentId);
    const aptObjectId = new Types.ObjectId(aptId);

    const flatNumber = flat?.flatNumber || "Assigned Flat";

    // 1. Fetch announcements
    const announcements = await Announcement.find({
        apartmentId: aptObjectId,
        status: "PUBLISHED",
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    // 2. Fetch resident complaints
    const complaints = await Complaint.find({
        resident: user.id,
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    // 3. Fetch resident guest passes
    const passConditions: Record<string, unknown>[] = [];
    if (flatId && Types.ObjectId.isValid(flatId)) {
        passConditions.push({ flatId: new Types.ObjectId(flatId) });
    }
    if (resident?._id) {
        passConditions.push({ createdByResidentId: resident._id });
    }

    const guestPasses = passConditions.length
        ? await GuestPassModel.find({
            apartmentId: aptObjectId,
            $or: passConditions,
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        : [];

    // Transform into unified feed items
    const feedItems: any[] = [];

    for (const a of announcements) {
        const isCritical = a.type === "EMERGENCY" || a.priority === "URGENT";
        const rawDate = a.createdAt ? new Date(a.createdAt) : new Date();
        feedItems.push({
            id: `ann-${a._id.toString()}`,
            type: "ANNOUNCEMENT",
            title: a.title,
            meta: `Target: ${a.targetType === "ALL_RESIDENTS" ? "All Residents" : "Targeted Blocks"} • Priority: ${a.priority}`,
            description: a.message,
            badge: isCritical
                ? { label: "CRITICAL NOTICE", variant: "rose" }
                : { label: "ANNOUNCEMENT", variant: "amber" },
            tags: [a.type || "Notice", a.priority].filter(Boolean),
            author: {
                name: (a as any).creator?.name || "Apartment Office",
                verified: true,
                role: "Management",
            },
            ctaText: "View Notice",
            ctaHref: "/resident/announcements",
            date: !isNaN(rawDate.getTime())
                ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Recent",
            rawDate: rawDate.toISOString(),
        });
    }

    for (const c of complaints) {
        const rawDate = c.createdAt ? new Date(c.createdAt) : new Date();
        const isResolved = c.status === "WORK_COMPLETED" || c.status === "CLOSED";
        feedItems.push({
            id: `comp-${c._id.toString()}`,
            type: "COMPLAINT",
            title: c.title,
            subtitle: `Ticket #${(c as any).ticketNumber || c._id.toString().slice(-6).toUpperCase()}`,
            meta: `Category: ${c.category} • Flat: ${flatNumber}`,
            description: c.description,
            badge: isResolved
                ? { label: "RESOLVED", variant: "emerald" }
                : { label: c.status || "IN PROGRESS", variant: "blue" },
            tags: [c.category, c.priority, c.status].filter(Boolean),
            author: {
                name: "Maintenance Desk",
                verified: true,
                role: "Facility Ops",
            },
            ctaText: "Track Request",
            ctaHref: "/resident/complaints",
            date: !isNaN(rawDate.getTime())
                ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Recent",
            rawDate: rawDate.toISOString(),
        });
    }

    for (const p of guestPasses) {
        const rawDate = p.createdAt ? new Date(p.createdAt) : new Date();
        const isActive = p.status === GuestPassStatus.ACTIVE;
        feedItems.push({
            id: `pass-${p._id.toString()}`,
            type: "PASS",
            title: `Visitor: ${p.visitorName}`,
            subtitle: p.purpose ? `Purpose: ${p.purpose}` : undefined,
            meta: `Gate Pass Code: ${p.rawToken ? p.rawToken.slice(0, 8).toUpperCase() : p._id.toString().slice(-6).toUpperCase()}${p.vehicleNumber ? ` • Vehicle: ${p.vehicleNumber}` : ""}`,
            description: `Scheduled entry for unit ${flatNumber}. Valid until ${new Date(p.validUntil).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}.`,
            badge: isActive
                ? { label: "ACTIVE PASS", variant: "emerald" }
                : { label: p.status, variant: "purple" },
            tags: ["Guest Pass", p.status, p.vehicleType || "No Vehicle"].filter(Boolean),
            author: {
                name: "Gate Security System",
                verified: true,
                role: "Automated RFID & QR",
            },
            ctaText: "View Pass Details",
            ctaHref: "/resident/visitors",
            date: !isNaN(rawDate.getTime())
                ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Recent",
            rawDate: rawDate.toISOString(),
        });
    }

    // Chronological sort: newest first
    feedItems.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    const activeComplaintsCount = complaints.filter(
        (c) => c.status !== "WORK_COMPLETED" && c.status !== "CLOSED" && c.status !== "REJECTED" && c.status !== "CANCELLED"
    ).length;
    const activePassesCount = guestPasses.filter((p) => p.status === GuestPassStatus.ACTIVE).length;

    return {
        feed: feedItems,
        counts: {
            activeComplaints: activeComplaintsCount,
            activePasses: activePassesCount,
            totalAnnouncements: announcements.length,
        },
    };
};
