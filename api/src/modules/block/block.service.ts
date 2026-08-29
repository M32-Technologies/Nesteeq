import { Types } from "mongoose";

import { AppError } from "../../utils/AppError.js";
import { Block } from "./block.model.js";
import {
  BlockListQuery,
  CreateBlockInput,
} from "./block.validation.js";

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

  const blockObject = block.toObject();

  return {
    id: blockObject._id.toString(),
    apartmentId: blockObject.apartmentId.toString(),
    name: blockObject.blockname,
    blockname: blockObject.blockname,
    code: blockObject.code,
    totalFloors: blockObject.totalFloors,
    status: blockObject.status,
    createdAt: blockObject.createdAt,
    updatedAt: blockObject.updatedAt,
  };
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
    .lean();

  return {
    blocks: blocks.map((block) => ({
      id: block._id.toString(),
      apartmentId: block.apartmentId.toString(),
      name: block.blockname,
      blockname: block.blockname,
      code: block.code,
      totalFloors: block.totalFloors,
      status: block.status,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    })),
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
    .lean();

  if (!block) {
    throw new AppError("Block not found in this apartment", 404);
  }

  return {
    id: block._id.toString(),
    apartmentId: block.apartmentId.toString(),
    name: block.blockname,
    blockname: block.blockname,
    code: block.code,
    totalFloors: block.totalFloors,
    status: block.status,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
};
