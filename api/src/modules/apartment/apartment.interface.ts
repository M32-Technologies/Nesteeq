import { Types } from "mongoose";

export interface IFlat {
  flatNumber: string;
  floor: number;
}

export interface IBlock {
  name: string;
  floors: number;
  flats?: IFlat[];
}

export interface IApartment {
  name: string;
  email: string;
  state: string;
  city: string;
  address: string;
  totalUnits: number;
  totalFloors: number;
  totalBlocks: number;
  parkingSlots: number;
  contactNumber: string;
  emergencyNumber: string;
  status: "pending_payment" | "active" | "inactive";
  setupRequestId?: string;
  blocks: IBlock[];
  createdAt?: Date;
  updatedAt?: Date;
  _id?: Types.ObjectId;
}
