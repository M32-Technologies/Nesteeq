import { Document, Types } from "mongoose";
import { z } from "zod";

export type OccupancyStatus = "VACANT" | "OWNER" | "TENANT";
export type FlatStatus = "active" | "inactive";

export interface IFlat extends Document {
  apartmentId: Types.ObjectId;
  blockId: Types.ObjectId;
  floorNumber: number;
  residentId: Types.ObjectId | null;
  flatNumber: string;
  occupancyStatus: OccupancyStatus;
  status: FlatStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const objectIdSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: `${fieldName} must be a valid id`,
    });

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const flatListQueryObjectSchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  blockId: z.preprocess(emptyToUndefined, objectIdSchema("Block id").optional()),
  floorNumber: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({
        message: "Invalid floor number",
      })
      .int("Invalid floor number")
      .min(1, "Invalid floor number")
      .optional(),
  ),
  occupancyStatus: z.preprocess(
    emptyToUndefined,
    z.enum(["VACANT", "OWNER", "TENANT"]).optional()
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["active", "inactive"]).optional()
  ),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).optional(),
  ).default(1),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(500).optional(),
  ).default(100),
  sortBy: z
    .enum([
      "flatNumber",
      "floorNumber",
      "occupancyStatus",
      "status",
      "createdAt",
      "updatedAt",
    ])
    .default("flatNumber"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const flatListQuerySchema = z.object({
  query: flatListQueryObjectSchema,
});

export const createFlatBodySchema = z
  .object({
    blockId: objectIdSchema("Block id"),
    floorNumber: z.coerce
      .number({
        message: "Invalid floor number",
      })
      .int("Invalid floor number")
      .min(1, "Invalid floor number"),
    flatNumber: z
      .string()
      .trim()
      .min(1, "Flat number is required")
      .max(30, "Flat number must be 30 characters or less"),
  })
  .strict();

export const createFlatSchema = z.object({
  body: createFlatBodySchema,
});

export const generateFlatsBodySchema = z
  .object({
    blockId: objectIdSchema("Block id"),
    unitsPerFloor: z.coerce
      .number({
        message: "Invalid units per floor",
      })
      .int("Units per floor must be a whole number")
      .min(1, "Units per floor must be greater than 0")
      .max(100, "Units per floor cannot exceed 100"),
  })
  .strict();

export const generateFlatsSchema = z.object({
  body: generateFlatsBodySchema,
});

export const updateFlatBodySchema = z
  .object({
    floorNumber: z.coerce
      .number({
        message: "Invalid floor number",
      })
      .int("Invalid floor number")
      .min(1, "Invalid floor number")
      .optional(),
    flatNumber: z
      .string()
      .trim()
      .min(1, "Flat number is required")
      .max(30, "Flat number must be 30 characters or less")
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.floorNumber !== undefined || data.flatNumber !== undefined,
    {
      message: "At least one field is required",
    },
  );

export const flatIdParamsSchema = z.object({
  id: objectIdSchema("Flat id"),
});

export const getFlatByIdSchema = z.object({
  params: flatIdParamsSchema,
});

export const updateFlatSchema = z.object({
  params: flatIdParamsSchema,
  body: updateFlatBodySchema,
});

export const deactivateFlatSchema = z.object({
  params: flatIdParamsSchema,
});

export const updateFlatStatusBodySchema = z
  .object({
    status: z.enum(["active", "inactive"]),
  })
  .strict();

export const updateFlatStatusSchema = z.object({
  params: flatIdParamsSchema,
  body: updateFlatStatusBodySchema,
});

export type FlatListQuery = z.infer<typeof flatListQueryObjectSchema>;
export type CreateFlatInput = z.infer<typeof createFlatBodySchema>;
export type GenerateFlatsInput = z.infer<typeof generateFlatsBodySchema>;
export type UpdateFlatInput = z.infer<typeof updateFlatBodySchema>;
export type UpdateFlatStatusInput = z.infer<typeof updateFlatStatusBodySchema>;
export type FlatIdParams = z.infer<typeof flatIdParamsSchema>;
