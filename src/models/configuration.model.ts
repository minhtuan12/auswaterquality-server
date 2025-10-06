import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const ConfigurationSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    tabs: [{ type: { key: String, name: String, order: Number } }],
    configurations: { type: Object },
  },
  { timestamps: true },
)

const ConfigurationModel = mongoose.model<{ _id: string; configurations: { [key: string]: any } }>(
  'Configuration',
  ConfigurationSchema,
)

export default ConfigurationModel
