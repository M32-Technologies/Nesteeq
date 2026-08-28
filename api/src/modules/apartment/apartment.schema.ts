import { Types } from "mongoose";
export interface IApartment {
  id: string;
  managerId: string;
  name: string;
  state: string;
  city: string;
  address: string;
  status: string;
  totalUnits: string;
  totalFloors: string;
  totalBlocks: string;
  parkingSlots: string;
  contactNumber: string;
  emergencyContact?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: Types.ObjectId;
}
