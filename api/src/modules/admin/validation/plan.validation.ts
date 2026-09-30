import { z } from "zod";


const freeTrialSchema = z
    .object({
        enabled: z.boolean(),
        days: z.number().int().min(0, "Free trial days must be >= 0"),
    })
    .superRefine((val, ctx) => {
        if (val.enabled && val.days <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Free trial days must be greater than 0 when free trial is enabled",
                path: ["days"],
            });
        }
    });

const featuresSchema = z
    .array(
        z.string().trim().min(1, "Feature cannot be empty")
    )
    .optional();

const createPlanBodySchema = z.object({
    planName: z.string().trim().min(1, "Plan name is required"),
    price: z.number().min(0, "Price must be >= 0"),
    planType: z.string().trim().min(1, "Plan type is required"),
    durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
    features: featuresSchema,
    freeTrial: freeTrialSchema.optional(),
    razorpayPlanId: z.string().trim().min(1, "Razorpay Plan ID is required"),
});

export const createPlanSchema = z.object({
    body: createPlanBodySchema,
});

const updatePlanBodySchema = z
    .object({
        planName: z.string().trim().min(1, "Plan name is required").optional(),
        planType: z.string().trim().min(1, "Plan type is required").optional(),
        price: z.number().min(0, "Price must be >= 0").optional(),
        durationMonths: z.number().int().min(1, "Duration must be at least 1 month").optional(),
        features: featuresSchema,
        freeTrial: freeTrialSchema.optional(),
        razorpayPlanId: z.string().trim().min(1, "Razorpay Plan ID is required").optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        { message: "At least one field must be provided for update" }
    );

export const updatePlanSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Plan ID is required"),
    }),
    body: updatePlanBodySchema,
});

export const updatePlanStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Plan ID is required"),
    }),
    body: z.object({
        isActive: z.boolean({ message: "isActive must be a boolean" }),
    }),
});

const getAllPlansQueryObjectSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10),
    search: z
        .string()
        .trim()
        .optional(),
    isActive: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
    sortBy: z
        .enum(["planName", "price", "durationMonths", "createdAt"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getAllPlansQuerySchema = z.object({
    query: getAllPlansQueryObjectSchema,
});

export type CreatePlanBody = z.infer<typeof createPlanBodySchema>;
export type UpdatePlanBody = z.infer<typeof updatePlanBodySchema>;
export type GetAllPlansQuery = z.infer<typeof getAllPlansQueryObjectSchema>;
