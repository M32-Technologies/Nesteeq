import { Types } from "mongoose";

export type BlockQueryFilter = {
  apartmentId: Types.ObjectId;
  status?: "active" | "inactive";
  $or?: Array<{ blockname: RegExp } | { code: RegExp }>;
};

export type BlockResponse = {
  id: string;
  apartmentId: string;
  blockname: string;
  code: string;
  totalFloors: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetBlocksResponse = {
  blocks: BlockResponse[];
};

export type UpdateBlockStatusInput = {
  status: "active" | "inactive";
  apartmentId: string;
  blockId: string;
};