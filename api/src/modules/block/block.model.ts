import { Document, model, Schema , Types } from "mongoose"

export interface IBlock extends Document {
    apartmentId: Types.ObjectId,
    blockname: string
    code: string
    totalFloors: number
    status: "active" | "inactive",
    createdAt: Date;
    updatedAt: Date;
}

const blockSchema = new Schema<IBlock>(
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