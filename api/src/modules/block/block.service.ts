import { Types } from "mongoose";

import { AppError } from "../../utils/AppError.js";
import { Block } from "./block.model.js";
import {
  BlockListQuery,
  CreateBlockInput,
  UpdateBlockInput,
} from "./block.schema.js";

type BlockRecord = {
  _id: Types.ObjectId;
  apartmentId: Types.ObjectId;
  blockname: string;
  code: string;
  totalFloors: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
};

const mapBlock = (block: BlockRecord) => ({
  id: block._id.toString(),
  apartmentId: block.apartmentId.toString(),
  blockname: block.blockname,
  code: block.code,
  totalFloors: block.totalFloors,
  status: block.status,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
});

export const createBlock = async (data: CreateBlockInput, apartmentId?: string,) => {
  const code = data.code.trim().toUpperCase();

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  const existingBlock = await Block.findOne({
    apartmentId: apartmentId,
    code,
  })
    .select("_id")
    .lean();

  if (existingBlock) {
    throw new AppError("A block with this code already exists", 409);
  }

  const block = await Block.create({
    apartmentId: apartmentId,
    blockname: data.blockname,
    code,
    totalFloors: data.totalFloors,
    ...(data.status ? { status: data.status } : {}),
  });

  return mapBlock(block.toObject() as BlockRecord);
};

export const getBlocks = async (query: BlockListQuery, apartmentId?: string) => {

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  const filter: {
    apartmentId: string;
    status?: "active" | "inactive";
  } = {
    apartmentId: apartmentId,
  };

  if (query.status) {
    filter.status = query.status;
  }

  const blocks = await Block.find(filter)
    .select("_id apartmentId blockname code totalFloors status createdAt updatedAt")
    .sort({ blockname: 1 })
    .lean<BlockRecord[]>();

  return {
    blocks: blocks.map(mapBlock),
  };
};

export const getSingleBlock = async (apartmentId: string, blockId: string) => {

  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  if (!Types.ObjectId.isValid(blockId)) {
    throw new AppError("Block id must be a valid id", 400);
  }

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  })
    .select("_id apartmentId blockname code totalFloors status createdAt updatedAt")
    .lean<BlockRecord>();

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  return mapBlock(block);
};

export const updateBlock = async (
  data: UpdateBlockInput,
  apartmentId: string,
  blockId: string,
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  if (!Types.ObjectId.isValid(blockId)) {
    throw new AppError("Block id must be a valid id", 400);
  }

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
    })
      .select("_id")
      .lean();

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

  if (data.status !== undefined) {
    block.status = data.status;
  }

  await block.save();

  return mapBlock(block.toObject() as BlockRecord);
};

export const deleteBlock = async (apartmentId: string, blockId: string) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400);
  }

  if (!Types.ObjectId.isValid(blockId)) {
    throw new AppError("Block id must be a valid id", 400);
  }

  const block = await Block.findOne({
    _id: blockId,
    apartmentId,
  });

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  block.status = "inactive";
  await block.save();

  return mapBlock(block.toObject() as BlockRecord);
};
