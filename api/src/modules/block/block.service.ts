import { Types } from "mongoose";

import { AppError } from "../../utils/AppError.js";
import { Block } from "./block.model.js";
import {
  BlockListQuery,
  CreateBlockInput,
} from "./block.validation.js";

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
  name: block.blockname,
  blockname: block.blockname,
  code: block.code,
  totalFloors: block.totalFloors,
  status: block.status,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
});

export const createBlock = async (data: CreateBlockInput, apartmentId?: string,) => {
  const code = data.code.toUpperCase();

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

  const blocks = await Block.find({
    apartmentId: apartmentId,
    ...(query.status ? { status: query.status } : {}),
  })
    .select("_id apartmentId blockname code totalFloors status createdAt updatedAt")
    .sort({ blockname: 1 })
    .lean<BlockRecord[]>();

  return {
    blocks: blocks.map(mapBlock),
  };
};
