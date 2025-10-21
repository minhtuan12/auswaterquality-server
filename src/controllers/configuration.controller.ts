import { Response, Request } from 'express'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { ConfigurationModel } from '../models'

class ConfigurationController {
  private readonly configurationModel
  constructor() {
    this.configurationModel = ConfigurationModel
    this.getDetails = this.getDetails.bind(this)
    this.updateData = this.updateData.bind(this)
  }
  async getDetails(req: Request, res: Response) {
    try {
      const configurations = await this.configurationModel.find()
      return ResponseHelper.success(res, configurations[0], 'Configurations retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
  updateFields(value: string, lastVal: any) {
    if (value || value === '') {
      return { ...lastVal, value }
    }
    return lastVal
  }
  async updateData(req: Request, res: Response) {
    try {
      const requestData = req.body
      const configurationResults = await this.configurationModel.find()
      const configs = configurationResults[0].configurations
      const results: any = {}
      Object.entries(configs).forEach(([itemKey, itemVal]: any) => {
        if (itemVal.type === 'group') {
          const groupResults: any = {}
          Object.entries(itemVal.fields).forEach(([fieldKey, fieldVal]: any) => {
            groupResults[fieldKey] = this.updateFields(requestData[fieldKey], fieldVal)
          })
          results[itemKey] = { ...itemVal, fields: groupResults }
        }
        if (itemVal.type !== 'group') {
          results[itemKey] = this.updateFields(requestData[itemKey], itemVal)
        }
      })

      const updateConfigs = await this.configurationModel.findOneAndUpdate(
        {},
        { configurations: results },
        { new: true },
      )

      return ResponseHelper.success(res, { configs, results, updateConfigs }, 'Configurations retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const configurationController = new ConfigurationController()
