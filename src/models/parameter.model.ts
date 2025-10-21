import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const ParameterSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    type: {
      type: String,
    },
    name: { type: String },
    displayName: { type: String },
    threshold1_11: { type: Number, default: null },
    threshold2_11: { type: Number, default: null },
    threshold3_11: { type: Number, default: null },
    threshold1_04: { type: Number, default: null },
    threshold2_04: { type: Number, default: null },
    threshold1_96: { type: Number, default: null },
    threshold2_96: { type: Number, default: null },
    units: { type: String, default: null },
  },
  { timestamps: true },
)

ParameterSchema.index({ name: 1 })

const ParameterModel = mongoose.model<any>('Parameter', ParameterSchema)

export default ParameterModel
