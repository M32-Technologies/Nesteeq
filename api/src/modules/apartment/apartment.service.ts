import { Apartment } from "./apartment.model.js";

import { AppError } from "../../utils/AppError.js";
import type { IBlock } from "./apartment.interface.js";

type ApartmentData = {
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
  setupRequestId?: string;
};

type BlockData = IBlock;

const isDuplicateKeyError = (
  error: unknown
): error is Error & { code: number } => {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const updateApartmentBlocks = async (
  apartmentId: string,
  blocks: BlockData[]
) => {
  const apartment = await Apartment.findByIdAndUpdate(
    apartmentId,
    { blocks },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  return apartment;
};

export const createApartmentService = async (
  data: ApartmentData
) => {
  if (data.setupRequestId) {
    const existingApartment =
      await Apartment.findOne({
        setupRequestId: data.setupRequestId,
      });

    if (existingApartment) {
      return existingApartment;
    }
  }

  try {
    return await Apartment.create({
      ...data,
      status: "pending_payment",
    });
  } catch (error) {
    if (data.setupRequestId && isDuplicateKeyError(error)) {
      const existingApartment =
        await Apartment.findOne({
          setupRequestId: data.setupRequestId,
        });

      if (existingApartment) {
        return existingApartment;
      }
    }

    throw error;
  }
};

export const addBlocksService = async (
  apartmentId: string,
  blocks: BlockData[]
) => {
  return updateApartmentBlocks(apartmentId, blocks);
};

export const addFlatsService = async (
  apartmentId: string,
  blocks: BlockData[]
) => {
  return updateApartmentBlocks(apartmentId, blocks);
};

export const getApartmentService = async (
  apartmentId: string
) => {
  const apartment = await Apartment.findById(apartmentId);

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  return apartment;
};
