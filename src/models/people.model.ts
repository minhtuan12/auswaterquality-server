import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const PeopleSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: { type: String },
    bioLink: { type: String },
    avatarUrl: { type: String },
    description: { type: String },
    meta: { type: Object },
  },
  { timestamps: true },
)

const PeopleModel = mongoose.model<{ _id: string } & Document>('People', PeopleSchema)

export default PeopleModel
