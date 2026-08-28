import { Document, Types } from 'mongoose';

export type OccupancyStatus = 'VACANT' | 'OWNER' | 'TENANT';

export interface IFlat extends Document {
  apartmentId: Types.ObjectId;
  blockId: Types.ObjectId;
  floorId: Types.ObjectId;
  ownerId: Types.ObjectId | null;
  tenantId: Types.ObjectId | null;
  flatNumber: string;
  occupancyStatus: OccupancyStatus;
  createdAt?: Date;
  updatedAt?: Date;
}