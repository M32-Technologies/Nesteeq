import mongoose, { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import type { GenerateParkingSlotsInput, GetParkingSlotsQuery, UpdateParkingSlotInput, AssignResidentParkingInput } from "./parking.validation.js"
import { ParkingSlotModel } from "./parking.model.js"
import { Apartment } from "../apartment/apartment.model.js"
import { Flat } from "../flat/flat.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import { escapeRegExp } from "../../utils/regex.js"
import type { GeneratedParkingSlotResponse } from "./parking.type.js"

export type { GeneratedParkingSlotResponse }

export const generateLevelCode = (level: string): string => {
  return level
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
};

const VEHICLE_CODE_MAP: Record<GenerateParkingSlotsInput["vehicleType"], string> = {
  CAR: "C",
  BIKE: "B",
  EV: "E",
  OTHER: "O",
};

export const getVehicleCode = (vehicleType: GenerateParkingSlotsInput["vehicleType"]): string => {
  return VEHICLE_CODE_MAP[vehicleType] ?? "O";
};

export const generateZoneCode = (zoneName?: string | null): string | null => {
  if (!zoneName || !zoneName.trim()) {
    return null;
  }
  return zoneName
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
};

export const generateParkingSlots = async (apartmentId: string,data: GenerateParkingSlotsInput): Promise<GeneratedParkingSlotResponse> => {
  const { level, zoneName, numberOfSlots, vehicleType, usageType } = data;

  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const session = await mongoose.startSession();

  try {
    let result: GeneratedParkingSlotResponse | undefined;

    await session.withTransaction(async () => {
      const apartment = await Apartment.findById(apartmentObjectId)
        .select("parkingSlots")
        .session(session)
        .lean();

      if (!apartment) {
        throw new AppError("Apartment not found", 404);
      }

      const normalizedLevel = level.trim();
      const normalizedZoneName = zoneName?.trim() || null;

      const currentCount = await ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
      }).session(session);

      if (apartment.parkingSlots) {
        const maxCapacity = Number(apartment.parkingSlots);
        const remainingSlots = maxCapacity - currentCount;

        if (numberOfSlots > remainingSlots) {
          throw new AppError(
            `Only ${remainingSlots} parking slots can be generated. ` +
              `${currentCount} of ${maxCapacity} parking slots already exist.`,
            400
          );
        }
      }

      const levelCode = generateLevelCode(normalizedLevel);
      const zoneCode = generateZoneCode(normalizedZoneName);
      const vehicleCode = getVehicleCode(vehicleType);

      const prefix = [levelCode, zoneCode, vehicleCode]
        .filter(Boolean)
        .join("-");

      // 5. Find existing slots with this prefix to determine next sequential number
      const existingSlots = await ParkingSlotModel.find({
        apartmentId: apartmentObjectId,
        prefix,
      })
        .select("slotNumber")
        .session(session)
        .lean();

      let nextNumber = 1;

      if (existingSlots.length > 0) {
        const highestNumber = existingSlots.reduce((max, slot) => {
          const match = slot.slotNumber.match(/(\d+)$/);
          const num = match ? Number(match[1]) : 0;
          return num > max ? num : max;
        }, 0);

        nextNumber = highestNumber + 1;
      }

      const slotsToGenerate = Array.from(
        { length: numberOfSlots },
        (_, index) => {
          const number = nextNumber + index;
          const slotNumber = `${prefix}-${String(number).padStart(3, "0")}`;

          return {
            apartmentId: apartmentObjectId,
            setupType: "ADVANCED" as const,
            level: normalizedLevel,
            zoneName: normalizedZoneName,
            zoneCode,
            prefix,
            slotNumber,
            vehicleType,
            usageType,
            status: "AVAILABLE" as const,
            flatId: null,
            residentId: null,
            visitorId: null,
            vehicleNumber: null,
            assignedAt: null,
          };
        }
      );

      const insertedSlots = await ParkingSlotModel.insertMany(slotsToGenerate, {
        session,
        ordered: true,
      });

      result = {
        totalSlotsGenerated: insertedSlots.length,
        level: normalizedLevel,
        zoneName: normalizedZoneName,
        zoneCode,
        prefix,
        generatedSlots: insertedSlots.map((slot) => ({
          id: slot._id.toString(),
          slotNumber: slot.slotNumber,
          level: slot.level,
          zoneName: slot.zoneName ?? null,
          zoneCode: slot.zoneCode ?? null,
          prefix: slot.prefix,
          vehicleType: slot.vehicleType,
          usageType: slot.usageType,
          status: slot.status,
        })),
      };
    });

    if (!result) {
      throw new AppError("Failed to generate parking slots", 500);
    }

    return result;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      throw new AppError(
        "One or more parking slots already exist. Please try again.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getParkingSlots = async (
  query: GetParkingSlotsQuery,
  apartmentId: string
) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);

  const apartment = await Apartment.findById(apartmentObjectId)
    .select("_id")
    .lean();

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  const filter: Record<string, unknown> = {
    apartmentId: apartmentObjectId,
  };

  if (query.vehicleType) {
    filter.vehicleType = query.vehicleType;
  }

  if (query.usageType) {
    filter.usageType = query.usageType;
  }
  
  if (query.status) {
    filter.status = query.status;
  }

  if (query.level) {
    filter.level = query.level;
  }

  if (query.zoneCode) {
    filter.zoneCode = query.zoneCode;
  }
  if (query.search) {
    const searchTerm = query.search.trim();

    if (searchTerm) {
      const regex = new RegExp(
        escapeRegExp(searchTerm),
        "i"
      );

      filter.$or = [
        {
          slotNumber: regex,
        },
        {
          vehicleNumber: regex,
        },
      ];
    }
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sortField = query.sortBy === "slotNumber" ? "slotNumber" : "createdAt";

  const sortOptions: Record<string, 1 | -1> =
    sortField === "slotNumber"
      ? { slotNumber: sortDirection, createdAt: -1 }
      : { [sortField]: sortDirection, slotNumber: 1 };

  const [parkingSlots, total] = await Promise.all([
    ParkingSlotModel.find(filter)
      .populate("flatId", "_id flatNumber")
      .populate(
        "residentId",
        "_id userId phoneNumber residentType"
      )
      .collation({ locale: "en", numericOrdering: true })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),

    ParkingSlotModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    parkingSlots,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
export const getParkingSlotById = async (parkingId: string, apartmentId: string) => {
  
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(parkingId)) {
    throw new AppError("Invalid parking id", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const parkingObjectId = new Types.ObjectId(parkingId);

  const parkingSlot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  })
    .populate("flatId", "_id flatNumber")
    .populate("residentId", "_id userId phoneNumber residentType")
    .lean();

  if (!parkingSlot) {
    throw new AppError("Parking slot not found", 404);
  }

  return parkingSlot;
};

export const updateParkingSlot = async (
  parkingId: string,
  data: UpdateParkingSlotInput,
  apartmentId?: string
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment id", 400);
  }

  if (!parkingId || !Types.ObjectId.isValid(parkingId)) {
    throw new AppError("Invalid parking id", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const parkingObjectId = new Types.ObjectId(parkingId);

  const parkingSlot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  });

  if (!parkingSlot) {
    throw new AppError("Parking slot not found", 404);
  }

  // Assigned / occupied slots must be released
  // before changing their parking configuration.
  if (
    parkingSlot.status === "ASSIGNED" ||
    parkingSlot.status === "OCCUPIED"
  ) {
    throw new AppError(
      "Parking slot must be released before changing parking configuration",
      400
    );
  }

  const updateData: Record<string, unknown> = {};

  // Level
  if (data.level !== undefined) {
    const level = data.level.trim();

    if (!level) {
      throw new AppError("Level cannot be empty", 400);
    }

    updateData.level = level;
  }

 
  if (data.zoneName !== undefined) {
    if (data.zoneName === null) {
      updateData.zoneName = null;
    } else {
      const zoneName = data.zoneName.trim();

      updateData.zoneName = zoneName || null;
    }
  }

  // Vehicle type
  if (data.vehicleType !== undefined) {
    updateData.vehicleType = data.vehicleType;
  }

  // Usage type
  if (data.usageType !== undefined) {
    updateData.usageType = data.usageType;
  }

  // Prevent an empty update
  if (Object.keys(updateData).length === 0) {
    throw new AppError("No parking slot fields provided for update", 400);
  }

  try {
    const updatedParkingSlot =
      await ParkingSlotModel.findOneAndUpdate(
        {
          _id: parkingObjectId,
          apartmentId: apartmentObjectId,
        },
        {
          $set: updateData,
        },
        {
          returnDocument: "after",
          runValidators: true,
        }
      ).lean();

    if (!updatedParkingSlot) {
      throw new AppError("Parking slot not found", 404);
    }

    return updatedParkingSlot;
  } catch (error: unknown) {
    throw error;
  }
};

export const assignResidentParking = async (
  parkingId: string,
  data: AssignResidentParkingInput,
  apartmentId?: string
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment id", 400);
  }

  if (!parkingId || !Types.ObjectId.isValid(parkingId)) {
    throw new AppError("Invalid parking id", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const parkingObjectId = new Types.ObjectId(parkingId);

  const parkingSlot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  });

  if (!parkingSlot) {
    throw new AppError("Parking slot not found", 404);
  }

  if (parkingSlot.usageType !== "RESIDENT") {
    throw new AppError("Visitor parking cannot be assigned as resident parking", 400);
  }

  if (parkingSlot.status !== "AVAILABLE") {
    throw new AppError("Parking slot is not available", 409);
  }

  if (!data.flatId || !Types.ObjectId.isValid(data.flatId)) {
    throw new AppError("Invalid flat id", 400);
  }

  const flatObjectId = new Types.ObjectId(data.flatId);

  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentObjectId,
  });

  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  let residentObjectId: Types.ObjectId | null = null;

  if (data.residentId) {
    if (!Types.ObjectId.isValid(data.residentId)) {
      throw new AppError("Invalid resident id", 400);
    }

    residentObjectId = new Types.ObjectId(data.residentId);

    const resident = await ResidentModel.findOne({
      _id: residentObjectId,
      apartmentId: apartmentObjectId,
    });

    if (!resident) {
      throw new AppError("Resident not found", 404);
    }

    if (resident.flatId.toString() !== flatObjectId.toString()) {
      throw new AppError("Resident does not belong to the selected flat", 400);
    }
  }

  const normalizedVehicleNumber = data.vehicleNumber.trim().toUpperCase();

  const updatedParkingSlot = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: parkingObjectId,
      apartmentId: apartmentObjectId,
      usageType: "RESIDENT",
      status: "AVAILABLE",
    },
    {
      $set: {
        status: "ASSIGNED",
        flatId: flatObjectId,
        residentId: residentObjectId ?? null,
        vehicleNumber: normalizedVehicleNumber,
        assignedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).lean();

  if (!updatedParkingSlot) {
    throw new AppError("Parking slot is no longer available", 409);
  }

  return updatedParkingSlot;
};

export const releaseResidentParking = async (
  parkingId: string,
  apartmentId?: string
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment id", 400);
  }

  if (!parkingId || !Types.ObjectId.isValid(parkingId)) {
    throw new AppError("Invalid parking id", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const parkingObjectId = new Types.ObjectId(parkingId);

  const parkingSlot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  });

  if (!parkingSlot) {
    throw new AppError("Parking slot not found", 404);
  }

  if (parkingSlot.usageType !== "RESIDENT") {
    throw new AppError(
      "Visitor parking cannot be released using the resident parking release API",
      400
    );
  }

  if (parkingSlot.status === "AVAILABLE") {
    throw new AppError("Parking slot is already available", 409);
  }

  if (parkingSlot.status === "INACTIVE") {
    throw new AppError("Cannot release an inactive parking slot", 400);
  }

  if (parkingSlot.status === "OCCUPIED") {
    throw new AppError("Occupied parking slot cannot be released using this API", 400);
  }

  if (parkingSlot.status !== "ASSIGNED") {
    throw new AppError("Only assigned parking slots can be released", 400);
  }

  if (!parkingSlot.flatId) {
    throw new AppError(
      "Parking slot is in an inconsistent state: missing assigned flat",
      400
    );
  }

  const releasedSlot = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: parkingObjectId,
      apartmentId: apartmentObjectId,
      usageType: "RESIDENT",
      status: "ASSIGNED",
    },
    {
      $set: {
        status: "AVAILABLE",
        flatId: null,
        residentId: null,
        visitorId: null,
        vehicleNumber: null,
        assignedAt: null,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).lean();

  if (!releasedSlot) {
    throw new AppError("Parking assignment has already changed", 409);
  }

  return releasedSlot;
};

export const updateParkingSlotStatus = async (
  parkingId: string,
  status: "AVAILABLE" | "INACTIVE",
  apartmentId?: string
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment id", 400);
  }

  if (!parkingId || !Types.ObjectId.isValid(parkingId)) {
    throw new AppError("Invalid parking id", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const parkingObjectId = new Types.ObjectId(parkingId);

  const parkingSlot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  });

  if (!parkingSlot) {
    throw new AppError("Parking slot not found", 404);
  }

  if (status === "INACTIVE") {
    if (parkingSlot.status === "INACTIVE") {
      throw new AppError("Parking slot is already inactive", 409);
    }

    if (parkingSlot.status === "ASSIGNED") {
      throw new AppError(
        "Assigned parking must be released before it can be deactivated",
        409
      );
    }

    if (parkingSlot.status === "OCCUPIED") {
      throw new AppError("Occupied parking cannot be deactivated", 409);
    }

    if (parkingSlot.status !== "AVAILABLE") {
      throw new AppError("Only available parking slots can be deactivated", 400);
    }

    const updatedSlot = await ParkingSlotModel.findOneAndUpdate(
      {
        _id: parkingObjectId,
        apartmentId: apartmentObjectId,
        status: "AVAILABLE",
      },
      {
        $set: {
          status: "INACTIVE",
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).lean();

    if (!updatedSlot) {
      throw new AppError("Parking slot status has already changed", 409);
    }

    return updatedSlot;
  }

  if (status === "AVAILABLE") {
    if (parkingSlot.status === "AVAILABLE") {
      throw new AppError("Parking slot is already active", 409);
    }

    if (parkingSlot.status === "ASSIGNED") {
      throw new AppError(
        "Assigned parking cannot be activated through this endpoint",
        409
      );
    }

    if (parkingSlot.status === "OCCUPIED") {
      throw new AppError(
        "Occupied parking cannot be activated through this endpoint",
        409
      );
    }

    if (parkingSlot.status !== "INACTIVE") {
      throw new AppError("Only inactive parking slots can be activated", 400);
    }

    const updatedSlot = await ParkingSlotModel.findOneAndUpdate(
      {
        _id: parkingObjectId,
        apartmentId: apartmentObjectId,
        status: "INACTIVE",
      },
      {
        $set: {
          status: "AVAILABLE",
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).lean();

    if (!updatedSlot) {
      throw new AppError("Parking slot status has already changed", 409);
    }

    return updatedSlot;
  }

  throw new AppError("Invalid status transition", 400);
};

export const getParkingStats = async (apartmentId: string) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);

  const [total, available, assigned, occupied, inactive, residentSlots, visitorSlots] =
    await Promise.all([
      ParkingSlotModel.countDocuments({ apartmentId: apartmentObjectId }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        status: "AVAILABLE",
      }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        status: "ASSIGNED",
      }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        status: "OCCUPIED",
      }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        status: "INACTIVE",
      }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        usageType: "RESIDENT",
      }),
      ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
        usageType: "VISITOR",
      }),
    ]);

  return {
    total,
    available,
    assigned,
    occupied,
    inactive,
    residentSlots,
    visitorSlots,
  };
};