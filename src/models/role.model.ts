import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { RoleDocument } from '../types/role.type'

const RoleSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: { type: String, required: [true, 'Role name is required'] },
    permissions: [{ type: String }],
  },
  { timestamps: true },
)

const RoleModel = mongoose.model<RoleDocument>('Role', RoleSchema)

export default RoleModel
