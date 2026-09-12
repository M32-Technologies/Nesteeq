import type { Types } from "mongoose";
import type { GenerateParkingSlotsInput } from "./parking.validation.js";

export interface GeneratedParkingSlotItem {
  id: string;
  slotNumber: string;
  level: string;
  zoneName: string | null;
  zoneCode: string | null;
  prefix: string;
  vehicleType: GenerateParkingSlotsInput["vehicleType"];
  usageType: GenerateParkingSlotsInput["usageType"];
  status: string;
}

export interface GeneratedParkingSlotResponse {
  totalSlotsGenerated: number;
  level: string;
  zoneName: string | null;
  zoneCode: string | null;
  prefix: string;
  generatedSlots: GeneratedParkingSlotItem[];
}

export interface ParkingStatsResponse {
  total: number;
  available: number;
  assigned: number;
  occupied: number;
  inactive: number;
  residentSlots: number;
  visitorSlots: number;
}

export interface PopulatedFlatInfo {
  _id: Types.ObjectId;
  flatNumber: string;
}

export interface PopulatedResidentInfo {
  _id: Types.ObjectId;
  userId?: string | null;
  phoneNumber?: string | null;
  residentType?: string | null;
}
