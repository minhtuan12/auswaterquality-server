import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { UserDocument } from '../types/user.type'

const UserSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    username: { type: String, required: [true, 'Username is required'] },
    status: { type: Number, default: 1 }, // 0: Inactive, 1: Active, 2: Invite, 3: Remove
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
      type: String,
      ref: 'Role',
    },
  },
  { timestamps: true },
)

const UserModel = mongoose.model<UserDocument>('User', UserSchema)

export default UserModel
