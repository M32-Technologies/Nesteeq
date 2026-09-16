import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { Block } from "../block/block.model.js";
import { Resident } from "../resident/resident.model.js";
import { Flat } from "./flat.model.js";
import type {
  CreateFlatInput,
  FlatListQuery,
  GenerateFlatsInput,
  OccupancyStatus,
  UpdateFlatInput,
  UpdateFlatStatusInput,
} from "./flat.validation.js";
import type {
  BlockForFlatCreate,
  AuthUserForFlatDetails,
  FlatQueryFilter,
  FlatRecord,
  FlatSortBy,
  FlatUpdateValues,
  ResidentForFlatDetails,
  SyncFlatOccupancyOptions,
} from "./flat.types.js";

const sortFields: Record<FlatSortBy, keyof FlatRecord> = {
  flatNumber: "flatNumber",
  floorNumber: "floorNumber",
  occupancyStatus: "occupancyStatus",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

import mongoose from "mongoose";
import { getSingleBlock } from "../block/block.service.js";
const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");



const ValidateObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} must be a valid id`, 400);
  }
};


const getBlockDetails = (blockId: FlatRecord["blockId"]) => {
  if (blockId instanceof Types.ObjectId) {
    return {
      id: blockId.toString(),
      blockname: "",
      code: "",
    };
  }

  return {
    id: blockId._id.toString(),
    blockname: blockId.blockname ?? "",
    code: blockId.code ?? "",
  };
};

const mapFlat = (flat: FlatRecord) => {
  const block = getBlockDetails(flat.blockId);

  return {
    id: flat._id.toString(),
    apartmentId: flat.apartmentId.toString(),
    blockId: block.id,
    block,
    residentId: flat.residentId?.toString() ?? null,
    floorNumber: flat.floorNumber,
    flatNumber: flat.flatNumber,
    occupancyStatus: flat.occupancyStatus ?? "VACANT",
    status: flat.status,
    createdAt: flat.createdAt,
    updatedAt: flat.updatedAt,
  };
};



const getResidentDetailsForFlat = async (flat: FlatRecord, apartmentId: string,) => {
  if (!flat.residentId) {
    return null;
  }

  const resident = await Resident.findOne({
    _id: flat.residentId,
    apartmentId,
    flatId: flat._id,
  })
    .select(
      "_id userId residentType phoneNumber status joinedAt createdAt updatedAt",
    );

  if (!resident) {
    return null;
  }

  let user: AuthUserForFlatDetails | null = null;
  if (resident.userId) {
    const userFilters: Record<string, unknown>[] = [{ id: resident.userId }];
    if (Types.ObjectId.isValid(resident.userId)) {
      userFilters.push({ _id: new Types.ObjectId(resident.userId) });
    }

    user = await getAuthDB()
      .collection<AuthUserForFlatDetails>("user")
      .findOne(
        { $or: userFilters },
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
        },
      );
  }

  return {
    id: resident._id.toString(),
    userId: resident.userId ?? null,
    name: user?.name ?? "Unknown user",
    email: user?.email ?? null,
    emailVerified: user?.emailVerified ?? false,
    image: user?.image ?? null,
    role: user?.role ?? resident.residentType,
    residentType: resident.residentType,
    phone: resident.phoneNumber ?? user?.phone ?? null,
    status: resident.status,
    joinedAt: resident.joinedAt ?? null,
    createdAt: resident.createdAt,
    updatedAt: resident.updatedAt,
  };
};

export const createFlat = async (data: CreateFlatInput, apartmentId?: string) => {
  const { blockId, flatNumber: unitNumber, floorNumber } = data;

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  ValidateObjectId(apartmentId, "Apartment id");
  ValidateObjectId(blockId, "Block id");

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  }).select("_id blockname code totalFloors status");

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  if (block.status !== "active") {
    throw new AppError("Cannot add a flat to an inactive block", 400);
  }

  if (!block.code || !block.code.trim()) {
    throw new AppError("Block does not have a valid code assigned", 400);
  }

  if (floorNumber > block.totalFloors) {
    throw new AppError(
      `Floor ${floorNumber} exceeds the block's total floors (${block.totalFloors})`,
      400
    );
  }

  const formattedUnit = String(unitNumber).padStart(2, "0");
  const formattedFlatNumber = `${block.code.trim().toUpperCase()}-${floorNumber}${formattedUnit}`;

  const existingFlat = await Flat.findOne({
    apartmentId,
    blockId,
    flatNumber: formattedFlatNumber,
  }).select("_id status");

  if (existingFlat) {
    if (existingFlat.status === "inactive") {
      throw new AppError(
        `Flat ${formattedFlatNumber} already exists as an inactive flat. Please activate it from the Inactive filter.`,
        409
      );
    }
    throw new AppError(`Flat ${formattedFlatNumber} already exists in the block`, 409);
  }

  let createdFlatId: string;
  try {
    const flat = await Flat.create({
      apartmentId,
      blockId,
      floorNumber,
      flatNumber: formattedFlatNumber,
      occupancyStatus: "VACANT",
      status: "active",
    });
    createdFlatId = flat._id.toString();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(`Flat ${formattedFlatNumber} already exists in the block`, 409);
    }
    throw error;
  }

  return getFlatById(createdFlatId, apartmentId);
};

export const generateFlats = async (data: GenerateFlatsInput, apartmentId?: string) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  ValidateObjectId(apartmentId, "Apartment id");
  ValidateObjectId(data.blockId, "Block id");

  const { blockId, unitsPerFloor, excludedUnits = [] } = data;
  const blockObjectId = new Types.ObjectId(blockId);
  const apartmentObjectId = new Types.ObjectId(apartmentId);


  const block = await getSingleBlock(apartmentId, blockId);

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  if (block.status !== "active") {
    throw new AppError("Cannot generate flats for an inactive block", 400);
  }

  if (!block.code || !block.code.trim()) {
    throw new AppError("Block code is required for flat generation", 400);
  }

  for (const item of excludedUnits) {
    if (item.floor > block.totalFloors) {
      throw new AppError(
        `Excluded floor ${item.floor} exceeds the block's total floors (${block.totalFloors})`,
        400
      );
    }
    if (item.unit > unitsPerFloor) {
      throw new AppError(
        `Excluded unit ${item.unit} exceeds the units per floor (${unitsPerFloor})`,
        400
      );
    }
  }

  const excludedSet = new Set(
    excludedUnits.map(({ floor, unit }) => `${floor}:${unit}`)
  );

  const blockCode = block.code.trim().toUpperCase();
  const flatsToCreate: Array<{
    apartmentId: Types.ObjectId;
    blockId: Types.ObjectId;
    floorNumber: number;
    flatNumber: string;
    occupancyStatus: OccupancyStatus;
    status: "active";
  }> = [];

  for (let floor = 1; floor <= block.totalFloors; floor += 1) {
    for (let unit = 1; unit <= unitsPerFloor; unit += 1) {
      if (excludedSet.has(`${floor}:${unit}`)) {
        continue;
      }

      flatsToCreate.push({
        apartmentId: apartmentObjectId,
        blockId: blockObjectId,
        floorNumber: floor,
        flatNumber: `${blockCode}-${floor}${String(unit).padStart(2, "0")}`,
        occupancyStatus: "VACANT",
        status: "active",
      });
    }
  }

  if (flatsToCreate.length === 0) {
    throw new AppError(
      "All flats have been excluded. At least one flat must be generated",
      400
    );
  }

  const flatNumbers = flatsToCreate.map((flat) => flat.flatNumber);

  const existingFlats = await Flat.find({
    apartmentId: apartmentObjectId,
    blockId: blockObjectId,
    flatNumber: {
      $in: flatNumbers,
    },
  })
    .select("flatNumber")
    .lean<{ flatNumber: string }[]>();

  if (existingFlats.length > 0) {
    const duplicates = existingFlats.map((flat) => flat.flatNumber).join(", ");
    throw new AppError(
      `Flat number(s) already exist in this block: ${duplicates}`,
      409
    );
  }
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await Flat.insertMany(flatsToCreate, {
      session,
      ordered: true
    });
    await session.commitTransaction();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("One or more flats already exist in this block", 409);
    }
    throw error;
  }finally {
     await session.endSession();
  }

  return {
    blockId: block.id.toString(),
    generatedCount: flatsToCreate.length,
    excludedCount: excludedSet.size,
  };
};

export const getFlat = async (query: FlatListQuery, apartmentId?: string) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  } 
  
  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const filter: FlatQueryFilter = {
    apartmentId: apartmentObjectId,
    status: "active"
  };

  if (query.blockId) {
    filter.blockId = new Types.ObjectId(query.blockId);
  }

  if (query.floorNumber) {
    filter.floorNumber = query.floorNumber;
  }

  if (query.occupancyStatus) {
    filter.occupancyStatus = query.occupancyStatus;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const searchTerm = query.search.trim();
    const regex = new RegExp(escapeRegex(searchTerm), "i");
    const floorNumber = /^[1-9]\d*$/.test(searchTerm)
      ? Number(searchTerm)
      : null;
    const matchingBlocks = await Block.find({
      apartmentId: apartmentObjectId,
      $or: [{ blockname: regex }, { code: regex }],
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>();

    filter.$or = [
      { flatNumber: regex },
      ...(floorNumber === null ? [] : [{ floorNumber }]),
      {
        blockId: {
          $in: matchingBlocks.map((block) => block._id),
        },
      },
    ];
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "desc" ? -1 : 1;
  const sortField = sortFields[query.sortBy];

  const [flats, totalCount] = await Promise.all([
    Flat.find(filter)
      .populate("blockId", "_id blockname code")
      .select(
        "_id apartmentId blockId residentId floorNumber flatNumber occupancyStatus status createdAt updatedAt",
      )
      .sort({ [sortField]: sortDirection, _id: 1 })
      .skip(skip)
      .limit(limit),
    Flat.countDocuments(filter),
  ]);

  return {
    flats: flats.map(mapFlat),
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    totalCount,
  };
};

export const getFlatById = async (flatId: string, apartmentId?: string) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flat = await Flat.findOne({
    _id: new Types.ObjectId(flatId),
    apartmentId: apartmentId,
  })
    .populate("blockId", "_id blockname code")
    .select(
      "_id apartmentId blockId residentId floorNumber flatNumber occupancyStatus status createdAt updatedAt",
    )
    .lean<FlatRecord>();

  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  return {
    ...mapFlat(flat),
    resident: await getResidentDetailsForFlat(flat, apartmentId),
  };
};

export const updateFlat = async (
  flatId: string,
  data: UpdateFlatInput,
  apartmentId?: string,
) => {

  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flatObjectId = new Types.ObjectId(flatId);
  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentId,
  })
    .select("_id apartmentId blockId floorNumber flatNumber")
    .lean<FlatRecord>();

  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  const blockObjectId =
    flat.blockId instanceof Types.ObjectId ? flat.blockId : flat.blockId._id;
  const updateData: FlatUpdateValues = {};

  if (data.floorNumber !== undefined) {
    if (!Number.isInteger(data.floorNumber) || data.floorNumber <= 0) {
      throw new AppError("Invalid floor number", 400);
    }

    const block = await Block.findOne({
      _id: blockObjectId,
      apartmentId: apartmentId,
    })
      .select("_id apartmentId blockname code totalFloors status")
      .lean<BlockForFlatCreate>();

    if (!block) {
      throw new AppError("Block does not exist", 404);
    }

    if (block.status !== "active") {
      throw new AppError("Block is inactive", 400);
    }

    if (data.floorNumber > block.totalFloors) {
      throw new AppError("Floor exceeds the block's total floors", 400);
    }

    updateData.floorNumber = data.floorNumber;
  }

  if (data.flatNumber !== undefined) {
    const flatNumber = data.flatNumber.trim().toUpperCase();

    if (!flatNumber) {
      throw new AppError("Flat number is required", 400);
    }

    const existingFlat = await Flat.findOne({
      _id: { $ne: flatObjectId },
      apartmentId: apartmentId,
      blockId: blockObjectId,
      flatNumber,
    })
      .select("_id")
      .lean();

    if (existingFlat) {
      throw new AppError("Flat number already exists in the block", 409);
    }

    updateData.flatNumber = flatNumber;
  }

  try {
    await Flat.updateOne(
      {
        _id: flatObjectId,
        apartmentId: apartmentId,
      },
      {
        $set: updateData,
      },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("Flat number already exists in the block", 409);
    }

    throw error;
  }

  return getFlatById(flatId, apartmentId);
};

export const updateFlatStatus = async (
  flatId: string,
  data: UpdateFlatStatusInput,
  apartmentId?: string,
) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flatObjectId = new Types.ObjectId(flatId);
  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentId,
  })
    .select("_id blockId")
    .lean<FlatRecord>();

  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  if (data.status === "active") {
    const blockObjectId =
      flat.blockId instanceof Types.ObjectId ? flat.blockId : flat.blockId._id;
    const block = await Block.findOne({
      _id: blockObjectId,
      apartmentId: apartmentId,
    })
      .select("_id status")
      .lean<BlockForFlatCreate>();

    if (!block) {
      throw new AppError("Block does not exist", 404);
    }

    if (block.status !== "active") {
      throw new AppError("Block is inactive", 400);
    }
  }

  await Flat.updateOne(
    {
      _id: flatObjectId,
      apartmentId: apartmentId,
    },
    {
      $set: {
        status: data.status,
      },
    },
  );

  if (data.status === "active") {
    await syncFlatOccupancy(flatObjectId, new Types.ObjectId(apartmentId));
  }

  return getFlatById(flatId, apartmentId);
};

export const syncFlatOccupancy = async (
  flatId: Types.ObjectId,
  apartmentId: Types.ObjectId,
  options: SyncFlatOccupancyOptions = {},
) => {
  const residents = await Resident.find({
    apartmentId,
    flatId,
    status: "active",
  })
    .select("_id residentType")
    .session(options.session ?? null)
    .lean<{ _id: Types.ObjectId; residentType: "owner" | "resident" }[]>();

  const primaryResident =
    residents.find((resident: any) => resident.residentType === "owner") ??
    residents[0] ??
    null;

  const occupancyStatus: OccupancyStatus = residents.some(
    (resident: any) => resident.residentType === "owner",
  )
    ? "OWNER"
    : residents.length > 0
      ? "TENANT"
      : "VACANT";

  await Flat.updateOne(
    {
      _id: flatId,
      apartmentId,
    },
    {
      $set: {
        occupancyStatus,
        residentId: primaryResident?._id ?? null,
      },
    },
  ).session(options.session ?? null);

  return {
    flatId: flatId.toString(),
    occupancyStatus,
    residentId: primaryResident?._id.toString() ?? null,
  };
};
