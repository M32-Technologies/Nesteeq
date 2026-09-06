import { Types } from "mongoose";

import { AppError } from "../../utils/AppError.js";
import { Block, IBlock } from "./block.model.js";
import {
  BlockListQuery,
  CreateBlockInput,
  UpdateBlockInput,
} from "./block.validation.js";
import type {
  BlockQueryFilter,
  BlockResponse,
  GetBlocksResponse,
  UpdateBlockStatusInput,
} from "./block.types.js";
import { getCurrentApartment } from "../apartment/apartment.service.js";
const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};



const mapBlock = (block: IBlock) => ({
  id: block._id.toString(),
  apartmentId: block.apartmentId.toString(),
  blockname: block.blockname,
  code: block.code,
  totalFloors: block.totalFloors,
  status: block.status,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
});

export const ValidateObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} must be a valid id`, 400);
  }
}

export const createBlock = async (data: CreateBlockInput, apartmentId?: string,) : Promise<BlockResponse> => {

  const code = data.code.trim().toUpperCase();

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  ValidateObjectId(apartmentId, "Apartment id");

  const apartments = await getCurrentApartment(apartmentId)

  const Blocks = await Block.find({
    apartmentId: apartmentId,
    status: "active"
  })
    .select("_id code")

  if (Blocks.length >= Number(apartments.totalBlocks)) {
    throw new AppError(`Maximum block limit reached. You cannot create more than ${apartments.totalBlocks} blocks for this apartment`, 400)
  }

  const IsExistingBlocks = Blocks.some((b) => b.code === code)

  if (IsExistingBlocks) {
    throw new AppError("A block with this code already exists", 409);
  }

  const block = await Block.create({
    apartmentId: apartmentId,
    blockname: data.blockname,
    code,
    totalFloors: data.totalFloors,
    ...(data.status ? { status: data.status } : {}),
  });

  return mapBlock(block)
};

export const getBlocks = async (query: BlockListQuery, apartmentId?: string) : Promise<GetBlocksResponse> => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  ValidateObjectId(apartmentId, "Apartment id");

  const filter: BlockQueryFilter = {
    apartmentId: new Types.ObjectId(apartmentId),
  };

  if(query.status){
    filter.status = query.status;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [{ blockname: searchRegex },{ code: searchRegex },];
  }

  const blocks = await Block.find(filter).sort({ blockname: 1 });

  return {
    blocks: blocks.map(mapBlock),
  };
};

export const getSingleBlock = async (apartmentId: string, blockId: string) : Promise<BlockResponse> => {

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  ValidateObjectId(apartmentId, "Apartment id");
  ValidateObjectId(blockId, "Block id");

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  })
  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }
  return mapBlock(block);
};

export const updateBlock = async (data: UpdateBlockInput, apartmentId: string, blockId: string) : Promise<BlockResponse> => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  ValidateObjectId(apartmentId, "Apartment id");
  ValidateObjectId(blockId, "Block id");

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  });

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  if (data.code !== undefined) {
    const code = data.code.trim().toUpperCase();
    const existingBlock = await Block.findOne({
      _id: { $ne: block._id },
      apartmentId,
      code,
    }).select("_id")

    if (existingBlock) {
      throw new AppError("A block with this code already exists", 409);
    }

    block.code = code;
  }

  if (data.blockname !== undefined) {
    block.blockname = data.blockname;
  }

  if (data.totalFloors !== undefined) {
    block.totalFloors = data.totalFloors;
  }


  await block.save();

  return mapBlock(block);
};


export const updateBlockStatus = async ({
  status,
  apartmentId,
  blockId,
}: UpdateBlockStatusInput): Promise<BlockResponse> => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  ValidateObjectId(apartmentId, "Apartment id");
  ValidateObjectId(blockId, "Block id");

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  });

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  if (block.status === status) {
    return mapBlock(block);
  }

  if (status === "active") {
    const apartments = await getCurrentApartment(apartmentId);

    const activeBlocks = await Block.find({
      apartmentId: apartmentId,
      status: "active",
    }).select("_id code");

    if (activeBlocks.length >= Number(apartments.totalBlocks)) {
      throw new AppError(
        `Maximum block limit reached. You cannot activate more than ${apartments.totalBlocks} blocks for this apartment`,
        400
      );
    }

    const isExistingCode = activeBlocks.some((b) => b.code === block.code);
    if (isExistingCode) {
      throw new AppError("A block with this code already exists", 409);
    }
  }

  block.status = status;
  await block.save();

  return mapBlock(block);
};
