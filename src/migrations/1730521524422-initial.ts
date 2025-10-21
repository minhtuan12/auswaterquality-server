import mongoose from 'mongoose'
// import { CategoryModel, UserModel, RoleModel, UserModel } from '../models'
// import userSeedData from '../database/user.seed.json'
// import roleSeedData from '../database/role.seed.json'
// import categorySeedData from '../database/category.seed.json'
// import StateSeedData from '../database/state.seed.json'
// import CommunitiesSeedData from '../database/communities.seed.json'
// import recordSeedData from '../database/records.json'
// import CommunityModel from '../models/community.model'
// import StateModel from '../models/state.model'
// import ADWRModel from '../models/adwr.model'

export async function up(): Promise<void> {
  mongoose.set('strictQuery', false)
  await mongoose.connect(process.env.MONGO_URI ?? 'mongodb://localhost:27017/virtual-prj')
  // await UserModel.insertMany(userSeedData)
  // await RoleModel.insertMany(roleSeedData)
  // await CategoryModel.insertMany(categorySeedData)
  // await StateModel.insertMany(StateSeedData)
  // await CommunityModel.insertMany(CommunitiesSeedData)
  // await ADWRModel.insertMany(recordSeedData)
}

export async function down(): Promise<void> {
  // Write migration here
}
