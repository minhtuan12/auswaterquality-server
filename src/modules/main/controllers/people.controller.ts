import { Response, Request } from 'express'
import ResponseHelper from '../../../utils/response.helper'
import { HttpStatusCode } from '../../../enums/httpCode.enum'
import PeopleGroupModel from '../../../models/peopleGroup.model'

class PeopleController {
  private readonly peopleGroupModel
  constructor() {
    this.peopleGroupModel = PeopleGroupModel
    this.getLists = this.getLists.bind(this)
  }
  async getLists(req: Request, res: Response) {
    try {
      const peoples = await this.peopleGroupModel.find({ status: 1 }).populate('peoples')
      return ResponseHelper.success(res, peoples, 'People retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const peopleController = new PeopleController()
