import { z } from "zod";

const blockNameField = z
  .string()
  .trim()
  .min(1, "Block name is required")
  .optional();

const blockStatusSchema = z.enum(["active", "inactive"]);

export const createBlockBodySchema = z
  .object({
    blockname: blockNameField,
    name: blockNameField,
    code: z
      .string()
      .trim()
      .min(1, "Block code is required")
      .max(20, "Block code must be 20 characters or less")
      .transform((value) => value.toUpperCase()),
    totalFloors: z.coerce
      .number()
      .int("Total floors must be a whole number")
      .min(1, "Total floors must be at least 1"),
    status: blockStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.blockname && !data.name) {
      ctx.addIssue({
        code: "custom",
        path: ["blockname"],
        message: "Block name is required",
      });
    }
  })
  .transform((data) => ({
    blockname: data.blockname ?? data.name ?? "",
    code: data.code,
    totalFloors: data.totalFloors,
    status: data.status,
  }));

export const createBlockSchema = z.object({
  body: createBlockBodySchema,
});

export const blockListQueryObjectSchema = z.object({
  status: blockStatusSchema.optional(),
});

export const blockListQuerySchema = z.object({
  query: blockListQueryObjectSchema,
});

export type CreateBlockInput = z.infer<typeof createBlockBodySchema>;
export type BlockListQuery = z.infer<typeof blockListQueryObjectSchema>;
