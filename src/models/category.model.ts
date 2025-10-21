import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { CategoryDocument } from '../types/category.type'

const CategorySchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    title: { type: String, required: [true, 'Title is required'] },
    slug: { type: String },
    status: { type: Number, default: 1 }, // Hidden/Active
  },
  { timestamps: true },
)

const CategoryModel = mongoose.model<CategoryDocument>('Category', CategorySchema)

export default CategoryModel
