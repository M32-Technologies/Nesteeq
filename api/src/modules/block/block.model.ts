import mongoose, { model, Schema } from "mongoose"

const blockSchema = new Schema(
    {
        apartmentId: {
            type: Schema.Types.ObjectId,
            ref: "Apartment",
            required: true,
            index: true,
        },

        blockname: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        totalFloors: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {
        timestamps: true,
    }
)

blockSchema.index(
    {
        apartmentId: 1,
        code: 1
    },
    {
        unique: true,
    }
)

export const Block = model("Block", blockSchema)