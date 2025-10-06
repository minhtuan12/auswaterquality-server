import { FilterQuery } from 'mongoose'
import { Response, Request } from 'express'
import PeopleModel from '../../../models/people.model'
import ResponseHelper from '../../../utils/response.helper'
import { HttpStatusCode } from '../../../enums/httpCode.enum'
import PeopleGroupModel from '../../../models/peopleGroup.model'
import { ValidatorHelper, ValidatorSchema } from '../../../utils/validator.helper'

type GetListRequest = Request<object, object, object, { q: string; page: string; limit: string }, object>

class PeopleController {
  private readonly peopleModel
  private readonly peopleGroupModel
  constructor() {
    this.peopleModel = PeopleModel
    this.peopleGroupModel = PeopleGroupModel
    this.getLists = this.getLists.bind(this)
    this.createData = this.createData.bind(this)
    this.updateData = this.updateData.bind(this)
    this.getListsGroup = this.getListsGroup.bind(this)
    this.createGroupData = this.createGroupData.bind(this)
    this.updateGroupData = this.updateGroupData.bind(this)
  }
  async getLists(req: GetListRequest, res: Response) {
    const q = req.query.q?.toLowerCase() || ''
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    try {
      const skip = (page - 1) * limit

      const searchQuery: FilterQuery<typeof this.peopleModel> = {}

      if (q) {
        const regex = new RegExp(q, 'i')
        searchQuery.$or = [{ name: regex }]
      }
      const [peoples, total] = await Promise.all([
        this.peopleModel.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        this.peopleModel.countDocuments(searchQuery),
      ])
      return ResponseHelper.paginated(
        res,
        peoples,
        {
          total,
          page,
          limit,
        },
        'People retrieved successfully',
      )
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async createData(req: Request, res: Response) {
    const { name, bioLink, avatarUrl, description } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createPeople)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const createData = { name, bioLink, avatarUrl, description }
      const people = await this.peopleModel.create(createData)
      return ResponseHelper.success(res, people, 'People created successfully')
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
      const people = await this.peopleModel.findByIdAndUpdate(id, updateData)
      return ResponseHelper.success(res, people, 'People updated successfully')
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
        throw new ResponseHelper('People not found', HttpStatusCode.BAD_REQUEST)
      }
      await this.peopleModel.findByIdAndDelete(id)
      return ResponseHelper.success(res, true, 'People removed successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async getListsGroup(req: GetListRequest, res: Response) {
    const q = req.query.q?.toLowerCase() || ''
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    try {
      const skip = (page - 1) * limit

      const searchQuery: FilterQuery<typeof this.peopleModel> = {}

      if (q) {
        const regex = new RegExp(q, 'i')
        searchQuery.$or = [{ name: regex }]
      }
      const [peoples, total] = await Promise.all([
        this.peopleGroupModel.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        this.peopleGroupModel.countDocuments(searchQuery),
      ])
      return ResponseHelper.paginated(
        res,
        peoples,
        {
          total,
          page,
          limit,
        },
        'People retrieved successfully',
      )
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async createGroupData(req: Request, res: Response) {
    const { name, peoples, meta } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createPeople)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const createData = { name, peoples, meta }
      if (meta) {
        createData['meta'] = meta
      }
      const people = await this.peopleGroupModel.create(createData)
      return ResponseHelper.success(res, people, 'People group created successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }

  async updateGroupData(req: Request, res: Response) {
    const { id } = req.params
    const { name, peoples, status, meta } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createPeople)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const updateData = { name, peoples, status, meta }
      if (meta) {
        updateData['meta'] = meta
      }
      const people = await this.peopleGroupModel.findByIdAndUpdate(id, updateData)
      return ResponseHelper.success(res, people, 'People group updated successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      return ResponseHelper.error(res, err.message, status)
    }
  }
}

export const peopleController = new PeopleController()
