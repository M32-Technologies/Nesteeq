import mongoose, { Types, type ClientSession } from "mongoose";

import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { Apartment } from "../apartment/apartment.model.js";
import { Block } from "../block/block.model.js";
import { Resident } from "../resident/resident.model.js";
import { Flat } from "./flat.model.js";
import type {
  CreateFlatInput,
  FlatListQuery,
  GenerateFlatsInput,
  OccupancyStatus,
  UpdateFlatInput,
} from "./flat.schema.js";
import type {
  ApartmentForFlatCreate,
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

const getApartmentObjectId = (apartmentId?: string) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  return new Types.ObjectId(apartmentId);
};

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const lockApartmentForUnitLimit = async (
  apartmentObjectId: Types.ObjectId,
  session: ClientSession,
) => {
  const apartment = await Apartment.findOneAndUpdate(
    {
      _id: apartmentObjectId,
    },
    {
      $set: {
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      session,
    },
  )
    .select("_id totalUnits")
    .lean<ApartmentForFlatCreate>();

  if (!apartment) {
    throw new AppError("Apartment context is required", 400);
  }

  return apartment;
};

const getApartmentTotalUnitLimit = (totalUnits: string) => {
  const totalUnitLimit = Number(totalUnits);

  if (
    !Number.isFinite(totalUnitLimit) ||
    !Number.isInteger(totalUnitLimit) ||
    totalUnitLimit <= 0
  ) {
    throw new AppError("Apartment total unit count is invalid", 400);
  }

  return totalUnitLimit;
};

const generateFlatNumbers = (
  blockCode: string,
  totalFloors: number,
  unitsPerFloor: number,
) => {
  const code = blockCode.trim().toUpperCase();
  const generatedFlats: Array<{
    floorNumber: number;
    flatNumber: string;
  }> = [];

  for (let floor = 1; floor <= totalFloors; floor += 1) {
    for (let unit = 1; unit <= unitsPerFloor; unit += 1) {
      generatedFlats.push({
        floorNumber: floor,
        flatNumber: `${code}-${floor}${String(unit).padStart(2, "0")}`,
      });
    }
  }

  return generatedFlats;
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

const mapGeneratedFlat = (flat: FlatRecord) => ({
  id: flat._id.toString(),
  flatNumber: flat.flatNumber,
  floorNumber: flat.floorNumber,
  occupancyStatus: flat.occupancyStatus ?? "VACANT",
  status: flat.status,
});

const getResidentDetailsForFlat = async (
  flat: FlatRecord,
  apartmentId: Types.ObjectId,
) => {
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
    )
    .lean<ResidentForFlatDetails>();

  if (!resident) {
    return null;
  }

  const user = resident.userId
    ? await getAuthDB()
      .collection<AuthUserForFlatDetails>("user")
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
        },
      )
    : null;

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

export const createFlat = async (
  data: CreateFlatInput,
  apartmentId?: string,
) => {
  const apartmentObjectId = getApartmentObjectId(apartmentId);

  if (!Types.ObjectId.isValid(data.blockId)) {
    throw new AppError("Block id must be a valid id", 400);
  }

  const blockObjectId = new Types.ObjectId(data.blockId);
  const flatNumber = data.flatNumber.trim().toUpperCase();
  const session = await mongoose.startSession();
  let createdFlatId: string | null = null;

  try {
    await session.withTransaction(async () => {
      const [apartment, block] = await Promise.all([
        lockApartmentForUnitLimit(apartmentObjectId, session),
        Block.findOne({
          _id: blockObjectId,
          apartmentId: apartmentObjectId,
        })
          .select("_id apartmentId blockname code totalFloors status")
          .session(session)
          .lean<BlockForFlatCreate>(),
      ]);

      if (!block) {
        throw new AppError("Block not found in this apartment", 404);
      }

      if (block.status !== "active") {
        throw new AppError("Block is inactive", 400);
      }

      if (!Number.isInteger(data.floorNumber) || data.floorNumber <= 0) {
        throw new AppError("Invalid floor number", 400);
      }

      if (data.floorNumber > block.totalFloors) {
        throw new AppError("Floor exceeds the block's total floors", 400);
      }

      if (!flatNumber) {
        throw new AppError("Flat number is required", 400);
      }

      const existingFlat = await Flat.findOne({
        apartmentId: apartmentObjectId,
        blockId: blockObjectId,
        flatNumber,
      })
        .select("_id")
        .session(session)
        .lean();

      if (existingFlat) {
        throw new AppError("Flat number already exists in the block", 409);
      }

      const totalUnitLimit = getApartmentTotalUnitLimit(apartment.totalUnits);
      const existingFlatCount = await Flat.countDocuments({
        apartmentId: apartmentObjectId,
      }).session(session);

      if (existingFlatCount >= totalUnitLimit) {
        throw new AppError(
          "Apartment has already reached its configured total unit limit",
          409,
        );
      }

      const [flat] = await Flat.create(
        [
          {
            apartmentId: apartmentObjectId,
            blockId: blockObjectId,
            floorNumber: data.floorNumber,
            flatNumber,
            occupancyStatus: "VACANT",
            status: "active",
          },
        ],
        {
          session,
        },
      );

      createdFlatId = flat._id.toString();
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("Flat number already exists in the block", 409);
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!createdFlatId) {
    throw new AppError("Unable to create flat", 500);
  }

  return getFlatById(createdFlatId, apartmentId);
};

export const generateFlats = async (data: GenerateFlatsInput,apartmentId?: string,) => {
  const apartmentObjectId = getApartmentObjectId(apartmentId);

  if (!Types.ObjectId.isValid(data.blockId)) {
    throw new AppError("Block id must be a valid id", 400);
  }

  if (
    !Number.isInteger(data.unitsPerFloor) ||
    data.unitsPerFloor <= 0 ||
    data.unitsPerFloor > 100
  ) {
    throw new AppError("Invalid units per floor", 400);
  }

  const blockObjectId = new Types.ObjectId(data.blockId);
  const session = await mongoose.startSession();
  let result: {
    blockId: string;
    blockName: string;
    blockCode: string;
    totalFloors: number;
    unitsPerFloor: number;
    totalFlatsGenerated: number;
    generatedFlats: ReturnType<typeof mapGeneratedFlat>[];
  } | null = null;

  try {
    await session.withTransaction(async () => {
      const [apartment, block] = await Promise.all([
        lockApartmentForUnitLimit(apartmentObjectId, session),
        Block.findOne({
          _id: blockObjectId,
          apartmentId: apartmentObjectId,
        })
          .select("_id apartmentId blockname code totalFloors status")
          .session(session)
          .lean<BlockForFlatCreate>(),
      ]);

      if (!block) {
        throw new AppError("Block not found in this apartment", 404);
      }

      if (block.status !== "active") {
        throw new AppError("Block is inactive", 400);
      }

      if (!block.code.trim()) {
        throw new AppError("Block code is required for flat generation", 400);
      }

      if (!Number.isInteger(block.totalFloors) || block.totalFloors <= 0) {
        throw new AppError("Block total floors is invalid", 400);
      }

      const totalUnitLimit = getApartmentTotalUnitLimit(apartment.totalUnits);

      const flatsToGenerate = generateFlatNumbers(
        block.code,
        block.totalFloors,
        data.unitsPerFloor,
      );
      const existingFlatCount = await Flat.countDocuments({
        apartmentId: apartmentObjectId,
      }).session(session);

      if (existingFlatCount + flatsToGenerate.length > totalUnitLimit) {
        throw new AppError(
          "Generating these flats would exceed the configured total unit count for this property.",
          409,
        );
      }

      const duplicateFlat = await Flat.findOne({
        apartmentId: apartmentObjectId,
        blockId: blockObjectId,
        flatNumber: {
          $in: flatsToGenerate.map((flat) => flat.flatNumber),
        },
      })
        .select("_id flatNumber")
        .session(session)
        .lean<{ _id: Types.ObjectId; flatNumber: string }>();

      if (duplicateFlat) {
        throw new AppError(
          `Generated flat number already exists in this block: ${duplicateFlat.flatNumber}`,
          409,
        );
      }

      const generatedFlats = await Flat.insertMany(
        flatsToGenerate.map((flat) => ({
          apartmentId: apartmentObjectId,
          blockId: blockObjectId,
          floorNumber: flat.floorNumber,
          flatNumber: flat.flatNumber,
          occupancyStatus: "VACANT",
          status: "active",
        })),
        {
          ordered: true,
          session,
        },
      );

      result = {
        blockId: block._id.toString(),
        blockName: block.blockname,
        blockCode: block.code,
        totalFloors: block.totalFloors,
        unitsPerFloor: data.unitsPerFloor,
        totalFlatsGenerated: generatedFlats.length,
        generatedFlats: generatedFlats.map((flat) =>
          mapGeneratedFlat(flat.toObject() as FlatRecord),
        ),
      };
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isDuplicateKeyError(error)) {
      throw new AppError("Generated flat numbers already exist", 409);
    }

    throw new AppError("Flat generation failed", 500);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new AppError("Flat generation failed", 500);
  }

  return result;
};

export const getFlat = async (query: FlatListQuery, apartmentId?: string) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400);
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId);
  const filter: FlatQueryFilter = {
    apartmentId: apartmentObjectId,
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
      .limit(limit)
      .lean<FlatRecord[]>(),
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
  const apartmentObjectId = getApartmentObjectId(apartmentId);

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flat = await Flat.findOne({
    _id: new Types.ObjectId(flatId),
    apartmentId: apartmentObjectId,
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
    resident: await getResidentDetailsForFlat(flat, apartmentObjectId),
  };
};

export const updateFlat = async (
  flatId: string,
  data: UpdateFlatInput,
  apartmentId?: string,
) => {
  const apartmentObjectId = getApartmentObjectId(apartmentId);

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flatObjectId = new Types.ObjectId(flatId);
  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentObjectId,
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
      apartmentId: apartmentObjectId,
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
      apartmentId: apartmentObjectId,
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
        apartmentId: apartmentObjectId,
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

export const deactivateFlat = async (flatId: string, apartmentId?: string) => {
  const apartmentObjectId = getApartmentObjectId(apartmentId);

  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Flat id must be a valid id", 400);
  }

  const flatObjectId = new Types.ObjectId(flatId);
  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentObjectId,
  })
    .select("_id")
    .lean();

  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  await Flat.updateOne(
    {
      _id: flatObjectId,
      apartmentId: apartmentObjectId,
    },
    {
      $set: {
        status: "inactive",
      },
    },
  );

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
    residents.find((resident) => resident.residentType === "owner") ??
    residents[0] ??
    null;

  const occupancyStatus: OccupancyStatus = residents.some(
    (resident) => resident.residentType === "owner",
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
