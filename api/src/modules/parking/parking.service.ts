import mongoose, {Types} from "mongoose"

import { AppError } from "../../utils/AppError.js"
import type { GenerateParkingSlotsInput, GetParkingSlotsQuery, UpdateParkingSlotInput, AssignResidentParkingInput } from "./parking.validation.js"
import { ParkingSlotModel } from "./parking.model.js"
import { Apartment } from "../apartment/apartment.model.js"
import { Flat } from "../flat/flat.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import { escapeRegExp } from "../../utils/regex.js"



export const generateParkingSlots = async (apartmentId: string, data: GenerateParkingSlotsInput) => {
  const { prefix, totalSlots, startNumber = 1, vehicleType, usageType } = data;

  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const apartment = await Apartment.findById(apartmentObjectId)
        .select("parkingSlots")
        .session(session)
        .lean();

      if (!apartment) {
        throw new AppError("Apartment not found", 404);
      }

      const normalizedPrefix = prefix.trim().toUpperCase();

      const currentCount = await ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
      }).session(session);

      if (apartment.parkingSlots) {
        const maxCapacity = Number(apartment.parkingSlots);
        const remainingSlots = maxCapacity - currentCount;

        if (totalSlots > remainingSlots) {
          throw new AppError(
            `Only ${remainingSlots} parking slots can be generated. ${currentCount} of ${maxCapacity} parking slots already exist.`,
            400
          );
        }
      }

      const slotsToGenerate = Array.from({ length: totalSlots }, (_, index) => {
        const number = startNumber + index;
        return {
          apartmentId: apartmentObjectId,
          slotNumber: `${normalizedPrefix}-${String(number).padStart(3, "0")}`,
          vehicleType,
          usageType,
          status: "AVAILABLE",
        };
      });

      const slotNumbers = slotsToGenerate.map((slot) => slot.slotNumber);

      const existingSlots = await ParkingSlotModel.find({
        apartmentId: apartmentObjectId,
        slotNumber: { $in: slotNumbers },
      })
        .select("slotNumber")
        .session(session)
        .lean();

      if (existingSlots.length > 0) {
        const duplicates = existingSlots.map((slot) => slot.slotNumber).join(", ");
        throw new AppError(`Parking slots already exist: ${duplicates}`, 409);
      }

      const insertedSlots = await ParkingSlotModel.insertMany(slotsToGenerate, { session });

      result = {
        totalSlotsGenerated: insertedSlots.length,
        generatedSlots: insertedSlots.map((slot) => ({
          id: slot._id.toString(),
          slotNumber: slot.slotNumber,
          vehicleType: slot.vehicleType,
          usageType: slot.usageType,
          status: slot.status,
        })),
      };
    });

    return result;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new AppError("One or more parking slots already exist. Please try again.", 409);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getParkingSlots = async (query: GetParkingSlotsQuery, apartmentId: string) => {
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

  if (query.search) {
    const searchTerm = query.search.trim();
    if (searchTerm) {
      const regex = new RegExp(escapeRegExp(searchTerm), "i");
      filter.slotNumber = regex;
    }
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [parkingSlots, total] = await Promise.all([
    ParkingSlotModel.find(filter)
      .populate("flatId", "_id flatNumber")
      .populate("residentId", "_id userId phoneNumber residentType")
      .sort({ createdAt: -1 })
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

  if (parkingSlot.status === "ASSIGNED" || parkingSlot.status === "OCCUPIED") {
    throw new AppError(
      "Parking slot must be released before changing usage or vehicle type",
      400
    );
  }

  let normalizedSlotNumber: string | undefined;
  if (data.slotNumber !== undefined) {
    normalizedSlotNumber = data.slotNumber.trim().toUpperCase();
  }

  if (normalizedSlotNumber !== undefined) {
    const existingSlot = await ParkingSlotModel.findOne({
      apartmentId: apartmentObjectId,
      slotNumber: normalizedSlotNumber,
      _id: { $ne: parkingObjectId },
    });

    if (existingSlot) {
      throw new AppError(
        `Parking slot ${normalizedSlotNumber} already exists`,
        409
      );
    }
  }

  const updateData: Record<string, unknown> = {};

  if (normalizedSlotNumber !== undefined) {
    updateData.slotNumber = normalizedSlotNumber;
  }

  if (data.vehicleType !== undefined) {
    updateData.vehicleType = data.vehicleType;
  }

  if (data.usageType !== undefined) {
    updateData.usageType = data.usageType;
  }

  try {
    const updatedParkingSlot = await ParkingSlotModel.findOneAndUpdate(
      {
        _id: parkingObjectId,
        apartmentId: apartmentObjectId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updatedParkingSlot) {
      throw new AppError("Parking slot not found", 404);
    }

    return updatedParkingSlot;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        `Parking slot ${normalizedSlotNumber || "with this number"} already exists`,
        409
      );
    }
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
      new: true,
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
      new: true,
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
        new: true,
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
        new: true,
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


