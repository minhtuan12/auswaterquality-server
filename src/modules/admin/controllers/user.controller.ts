import { Response, Request } from 'express'
import { HttpStatusCode } from '../../../enums/httpCode.enum'
import UserService from '../../../services/user.service'
import { AuthRequest } from '../../../types/user.type'
import { RegexHelper } from '../../../utils/regex.helper'
import ResponseHelper from '../../../utils/response.helper'
import { ValidatorHelper, ValidatorSchema } from '../../../utils/validator.helper'

class UserController {
  private readonly userService
  constructor() {
    this.userService = new UserService()
    this.getMyProfile = this.getMyProfile.bind(this)
    this.createUser = this.createUser.bind(this)
    this.getListUser = this.getListUser.bind(this)
  }
  async getMyProfile(req: Request, res: Response) {
    try {
      const { _id } = (req as AuthRequest).user
      const user = await this.userService.getUserById(_id)
      return ResponseHelper.success(res, user, 'User retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const { username, password, role } = req.body
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createUser)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      if (!RegexHelper.password.test(password)) {
        return ResponseHelper.error(
          res,
          'Password contain at least 1 uppercase, 1 lowercase and 8 character',
          HttpStatusCode.BAD_REQUEST,
        )
      }
      //   const hashedPassword = await bcrypt.hash(password, 10)
      const hashedPassword = password
      const createUser = await this.userService.create({ username, password: hashedPassword, role })
      return ResponseHelper.success(res, createUser, 'Create user successful')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getListUser(req: Request, res: Response) {
    const q = (req.query.q as string)?.toLowerCase() || ''
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    try {
      const users = await this.userService.getLists(q, page, limit)
      return ResponseHelper.paginated(res, users.data, users.meta, 'Users retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const userController = new UserController()
