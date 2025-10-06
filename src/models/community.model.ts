import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { NewsDocument } from '../types/news.type'

const CommunitySchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    state: { type: String, ref: 'State' },
    region: { type: String },
    name: { type: String, index: true },
    censusCode: { type: String },
    cencusName: { type: String },
    remoteArea: { type: String },
    longitude: { type: String },
    latitude: { type: String },
    locationType: { type: String },
    area: { type: String },
    waterSource: { type: String },
    waterProvider: { type: String },
    dataSource: { type: String },
    progress: {type: String},
    dataPeriod: {type: String},
  },
  { timestamps: true },
)

const CommunityModel = mongoose.model<NewsDocument>('Community', CommunitySchema)

export default CommunityModel
