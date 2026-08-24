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
    },
    {
        timestamps: true,
    }
)

blockSchema.index(
    {
        apartmentId: 1,
        blockname: 1,
    },
    {
        unique: true,
    }
)

export const Block = model("Block",blockSchema)