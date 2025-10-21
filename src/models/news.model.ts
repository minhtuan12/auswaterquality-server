import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { NewsDocument } from '../types/news.type'

const NewsSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    title: { type: String, required: [true, 'Title is required'] },
    slug: { type: String },
    thumbnailImage: { type: String },
    coverImage: { type: String },
    shortDesc: { type: String, required: [true, 'Short description is required'] },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    category: { type: String, ref: 'Category' },
    status: { type: Number, default: 0 }, // Draft/Pending/Public
    meta: { type: Object },
  },
  { timestamps: true },
)

const RoleModel = mongoose.model<NewsDocument>('News', NewsSchema)

export default RoleModel
