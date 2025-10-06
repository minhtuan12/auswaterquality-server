import { FilterQuery } from 'mongoose'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { UserModel } from '../models'
import { CreateUserInput, UserDocument, UserOutput } from '../types/user.type'
import ResponseHelper from '../utils/response.helper'

export default class UserService {
  private readonly userModel

  constructor() {
    this.userModel = UserModel
  }

  async create(userData: CreateUserInput): Promise<UserOutput> {
    const isUserExist = await this.isUserExist(userData.username)
    if (isUserExist) {
      throw new ResponseHelper('Username already taken', HttpStatusCode.CONFLICT)
    }

    const user = await this.userModel.create(userData)
    return this.sanitizeUser(user)
  }

  async getUserById(id?: string): Promise<UserOutput> {
    if (!id) {
      throw new ResponseHelper('User not found', HttpStatusCode.NOT_FOUND)
    }
    const user = await this.userModel.findById(id).populate({ path: 'role', select: 'name permissions' })
    if (!user) {
      throw new ResponseHelper('User not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeUser(user)
  }

  async getLists(
    q?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: UserOutput[]
    meta: { total: number; page: number; limit: number }
  }> {
    const skip = (page - 1) * limit

    const searchQuery: FilterQuery<typeof this.userModel> = {}

    if (q) {
      const regex = new RegExp(q, 'i')
      searchQuery.$or = [{ username: regex }]
    }

    const [users, total] = await Promise.all([
      this.userModel.find(searchQuery).select('-password').populate('role').skip(skip).limit(limit),
      this.userModel.countDocuments(searchQuery),
    ])

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
      },
    }
  }

  async isUserExist(username: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username }).populate({ path: 'role', select: 'name permissions' })
    return user
  }

  public sanitizeUser(user: UserDocument): UserOutput {
    const userObject = user.toObject ? user.toObject() : user
    delete userObject.password
    delete userObject.__v
    return userObject
  }
}
