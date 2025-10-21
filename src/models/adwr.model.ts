import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { ADWRDocument } from '../types/adwr.type'

const ADWRSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    year: { type: Number, index: true },
    community: { type: String, ref: 'Community', index: true },
    healthParameters: { type: Object },
    aestheticParameters: { type: Object },
    quality: { type: String, index: true },
  },
  { timestamps: true },
)

ADWRSchema.index({ year: 1, community: 1 })
ADWRSchema.index({ year: 1, quality: 1 })
ADWRSchema.index({ community: 1, quality: 1 })
ADWRSchema.index({ createdAt: -1 })
ADWRSchema.index({ updatedAt: -1 })

const ADWRModel = mongoose.model<ADWRDocument>('ADWR', ADWRSchema)

export default ADWRModel
