import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { NewsDocument } from '../types/news.type'

const StateSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: { type: String },
    code: { type: String, index: true },
  },
  { timestamps: true },
)

const StateModel = mongoose.model<NewsDocument>('State', StateSchema)

export default StateModel
