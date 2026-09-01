import type { ClientSession, Types } from "mongoose";

import { FlatListQuery , OccupancyStatus , FlatStatus } from "./flat.schema.js";

export type PopulatedBlock = {
  _id: Types.ObjectId;
  blockname?: string;
  code?: string;
};

export type FlatRecord = {
  _id: Types.ObjectId;
  apartmentId: Types.ObjectId;
  blockId: Types.ObjectId | PopulatedBlock;
  residentId?: Types.ObjectId | null;
  floorNumber: number;
  flatNumber: string;
  occupancyStatus?: OccupancyStatus;
  status: FlatStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export type BlockForFlatCreate = {
  _id: Types.ObjectId;
  apartmentId: Types.ObjectId;
  blockname: string;
  code: string;
  totalFloors: number;
  status: "active" | "inactive";
};

export type ApartmentForFlatCreate = {
  _id: Types.ObjectId;
  totalUnits: string;
};

export type FlatUpdateValues = {
  floorNumber?: number;
  flatNumber?: string;
};

export type ResidentForFlatDetails = {
  _id: Types.ObjectId;
  userId?: string | null;
  residentType: "owner" | "resident";
  phoneNumber?: string | null;
  status: "active" | "pending" | "inactive";
  joinedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AuthUserForFlatDetails = {
  id?: string;
  name?: string;
  email?: string | null;
  emailVerified?: boolean;
  image?: string | null;
  role?: string;
  phone?: string | null;
};

export type FlatQueryFilter = {
  apartmentId: Types.ObjectId;
  blockId?: Types.ObjectId;
  floorNumber?: number;
  flatNumber?: RegExp;
  occupancyStatus?: OccupancyStatus;
  status?: FlatStatus;
  $or?: Array<
    | { flatNumber: RegExp }
    | { floorNumber: number }
    | { blockId: { $in: Types.ObjectId[] } }
  >;
};

export type FlatSortBy = FlatListQuery["sortBy"];

export type SyncFlatOccupancyOptions = {
  session?: ClientSession;
};
