import { Schema, model, type InferSchemaType } from "mongoose";

const subscriptionPlanSchema = new Schema({
    planName: {
        type: String,
        required: true,
        trim: true,
    },

    price: {
        type: Number,
        required: true,
        min: 0,
    },

    planType: {
        type: String,
        enum: ["MONTHLY", "SIX_MONTHS", "YEARLY"],  
        required: true,
    },

    durationMonths: {
        type: Number,
        required: true,
        min: 1,
    },

    features: [
        {
            type: String,
            trim: true,
        },
    ],

    freeTrial: {
        enabled: {
            type: Boolean,
            default: false,
        },
        days: {
            type: Number,
            default: 0,
            min: 0,
        },
    },

    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

subscriptionPlanSchema.index({ planType: 1 }, { unique: true });

export type SubscriptionPlanDocument = InferSchemaType<typeof subscriptionPlanSchema>;

export const SubscriptionPlan = model("SubscriptionPlan", subscriptionPlanSchema);
