import mongoose, { model, Schema } from 'mongoose';
import { IFlat } from './flat.schema.js';

const flatSchema = new Schema<IFlat>(
  {
    apartmentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'apartment', 
      required: true 
    },
    blockId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Block', 
      required: true 
    },
    floorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Floor', 
      required: true 
    },
    ownerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Resident',
      default: null 
    },
    tenantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Resident',
      default: null 
    },
    flatNumber: { 
      type: String, 
      required: [true, 'Flat number is required'], 
      trim: true 
    },
    occupancyStatus: {
      type: String,
      enum: ['VACANT', 'OWNER', 'TENANT'],
      default: 'VACANT'
    }
  },
  { 
    timestamps: true 
  }
);

flatSchema.index({ blockId: 1, flatNumber: 1 }, { unique: true });

export const Flat = model<IFlat>('Flat', flatSchema);