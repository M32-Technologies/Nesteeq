import { Schema } from "mongoose";

import type { IBlock } from "./apartment.interface.js";
import { flatSchema } from "./flat.model.js";

export const blockSchema = new Schema<IBlock>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    floors: {
      type: Number,
      required: true,
    },

    flats: {
      type: [flatSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);
