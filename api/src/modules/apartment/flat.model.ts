import { Schema } from "mongoose";

import type { IFlat } from "./apartment.interface.js";

export const flatSchema = new Schema<IFlat>(
  {
    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);
