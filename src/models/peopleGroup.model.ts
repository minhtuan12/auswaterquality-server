import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const PeopleGroupSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: { type: String },
    peoples: [{ type: String, ref: 'People' }],
    status: { type: Number, default: 0 },
    meta: { type: Object },
  },
  { timestamps: true },
)

const PeopleGroupModel = mongoose.model<{ _id: string } & Document>('PeopleGroup', PeopleGroupSchema)

export default PeopleGroupModel
