import { z } from "zod";

export const createBlockSchema = z.object({
  body: z.object({
    blockname: z
      .string()
      .trim()
      .min(1, "Block name is required"),
    code: z
      .string()
      .trim()
      .min(1, "Block code is required")
      .max(20, "Block code must be 20 characters or less")
      .transform((val) => val.toUpperCase()),
    totalFloors: z.coerce
      .number()
      .int("Total floors must be a whole number")
      .min(1, "Total floors must be at least 1"),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const updateBlockSchema = z.object({
  body: z
    .object({
      blockname: z.string().trim().min(1, "Block name is required").optional(),
      code: z
        .string()
        .trim()
        .min(1, "Block code is required")
        .max(20, "Block code must be 20 characters or less")
        .transform((val) => val.toUpperCase())
        .optional(),
      totalFloors: z.coerce
        .number()
        .int("Total floors must be a whole number")
        .min(1, "Total floors must be at least 1")
        .optional(),
    })
    .refine(
      (data) =>
        data.blockname !== undefined ||
        data.code !== undefined ||
        data.totalFloors !== undefined ,
      {
        message: "At least one field is required",
      }
    ),
});

export const blockListQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const updateBlockStatusSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Block id is required"),
  }),
  body: z.object({
    status: z.enum(["active", "inactive"]),
  }),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>["body"];
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>["body"];
export type BlockListQuery = z.infer<typeof blockListQuerySchema>["query"];