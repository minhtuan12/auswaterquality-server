import { HttpStatusCode } from '../enums/httpCode.enum'
import { CategoryModel } from '../models'
import { CategoryDocument, CreateCategoryInput, ICategory, UpdateCategoryInput } from '../types/category.type'
import { ConvertHelper } from '../utils/convert.helper'
import ResponseHelper from '../utils/response.helper'

export default class CategoryService {
  private readonly categoryModel

  constructor() {
    this.categoryModel = CategoryModel
  }

  async getLists(): Promise<ICategory[]> {
    const categories = await this.categoryModel.find()
    return categories
  }

  async getCategoryById(id?: string): Promise<ICategory> {
    if (!id) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    const category = await this.categoryModel.findById(id)
    if (!category) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeCategory(category)
  }

  async createCategory(newsData: CreateCategoryInput): Promise<ICategory> {
    const { title } = newsData ?? {}
    const slug = ConvertHelper.sanitizerSlug(title)
    const createData = { title, slug }
    const category = await this.categoryModel.create(createData)
    return this.sanitizeCategory(category)
  }

  async updateCategory(newsData: UpdateCategoryInput): Promise<ICategory> {
    const { id, title } = newsData ?? {}
    if (!id) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    const category = await this.categoryModel.findById(id)
    if (!category) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    const slug = ConvertHelper.sanitizerSlug(title)
    const updatedData = { title, slug }
    const updatedCategory = await this.categoryModel.findByIdAndUpdate(id, updatedData, { new: true })
    if (!updatedCategory) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeCategory(updatedCategory)
  }

  async deleteCategoryById(id?: string): Promise<boolean> {
    if (!id) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    const category = await this.categoryModel.findById(id)
    if (!category) {
      throw new ResponseHelper('Category not found', HttpStatusCode.NOT_FOUND)
    }
    await this.categoryModel.findByIdAndDelete(id)
    return true
  }

  public sanitizeCategory(news: CategoryDocument): ICategory {
    const newsObject = news.toObject ? news.toObject() : news
    return newsObject
  }
}
