import { Response, Request } from 'express'
import { HttpStatusCode } from '../../../enums/httpCode.enum'
import { RoleModel, UserModel } from '../../../models'
import ResponseHelper from '../../../utils/response.helper'
import { ValidatorHelper, ValidatorSchema } from '../../../utils/validator.helper'

class RoleController {
  private readonly roleModel
  private readonly userModel
  constructor() {
    this.roleModel = RoleModel
    this.userModel = UserModel
    this.getLists = this.getLists.bind(this)
    this.createData = this.createData.bind(this)
    this.updateData = this.updateData.bind(this)
    this.removeData = this.removeData.bind(this)
  }
  async getLists(req: Request, res: Response) {
    try {
      const roles = await this.roleModel.find()
      return ResponseHelper.paginated(res, roles, { total: 0, limit: 10, page: 0 }, 'Roles retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async createData(req: Request, res: Response) {
    const { name, permissions } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createPeople)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const createData = { name, permissions }
      const people = await this.roleModel.create(createData)
      return ResponseHelper.success(res, people, 'Role created successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async updateData(req: Request, res: Response) {
    const { id } = req.params
    const { name, bioLink, avatarUrl, description } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createPeople)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const updateData = { name, bioLink, avatarUrl, description }
      const people = await this.roleModel.findByIdAndUpdate(id, updateData)
      return ResponseHelper.success(res, people, 'Role updated successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async removeData(req: Request, res: Response) {
    const { id } = req.params
    try {
      if (!id) {
        throw new ResponseHelper('Role not found', HttpStatusCode.BAD_REQUEST)
      }
      const findUser = await this.userModel.findOne({ role: id })
      if (findUser) {
        throw new ResponseHelper('Role is already used', HttpStatusCode.BAD_REQUEST)
      }
      await this.roleModel.findByIdAndDelete(id)
      return ResponseHelper.success(res, true, 'Role removed successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }
}

export const roleController = new RoleController()
