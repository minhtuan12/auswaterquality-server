import { Response, Request } from 'express'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import CategoryService from '../services/category.service'
import { ValidatorHelper, ValidatorSchema } from '../utils/validator.helper'
import { CreateCategoryInput } from '../types/category.type'
import { ResponseDetailParams } from '../types/general.type'

class CategoryController {
  private readonly categoryService
  constructor() {
    this.categoryService = new CategoryService()
    this.getLists = this.getLists.bind(this)
    this.getDetail = this.getDetail.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.updateCategory = this.updateCategory.bind(this)
    this.deleteCategory = this.deleteCategory.bind(this)
  }
  async getLists(req: Request, res: Response) {
    try {
      const categories = await this.categoryService.getLists()
      return ResponseHelper.success(res, categories, 'Categories retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getDetail(req: Request, res: Response) {
    const { id } = req.params
    try {
      const categories = await this.categoryService.getCategoryById(id)
      return ResponseHelper.success(res, categories, 'Category retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async createCategory(req: Request<object, object, CreateCategoryInput, object, object>, res: Response) {
    const { title } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createCategory)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const validData = { title }
      const category = await this.categoryService.createCategory(validData)
      return ResponseHelper.success(res, category, 'Created category successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async updateCategory(req: Request<ResponseDetailParams, object, CreateCategoryInput, object, object>, res: Response) {
    const { id } = req.params
    const { title } = req.body
    try {
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.updateCategory)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const validData = { id, title }
      const category = await this.categoryService.updateCategory(validData)
      return ResponseHelper.success(res, category, 'Updated category successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async deleteCategory(req: Request<ResponseDetailParams, object, CreateCategoryInput, object, object>, res: Response) {
    const { id } = req.params
    try {
      await this.categoryService.deleteCategoryById(id)
      return ResponseHelper.success(res, {}, 'Deleted category successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const categoryController = new CategoryController()
