import { FilterQuery } from 'mongoose'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { NewsModel } from '../models'
import { CreateNewsInput, INews, NewsDocument, UpdateNewsInput } from '../types/news.type'
import { ConvertHelper } from '../utils/convert.helper'
import ResponseHelper from '../utils/response.helper'

export default class NewsService {
  private readonly newsModel

  constructor() {
    this.newsModel = NewsModel
  }

  async getLists({
    q,
    page = 1,
    limit = 10,
    categories,
  }: {
    q?: string
    page?: number
    limit?: number
    categories?: string[]
  }): Promise<{
    data: INews[]
    meta: { total: number; page: number; limit: number }
  }> {
    const skip = (page - 1) * limit

    const searchQuery: FilterQuery<typeof this.newsModel> = { status: 2 }

    if (q) {
      const regex = new RegExp(q, 'i')
      searchQuery.$or = [{ title: regex }]
    }
    if (categories && categories.length > 0) {
      searchQuery.category = { $in: categories }
    }
    const [news, total] = await Promise.all([
      this.newsModel
        .find(searchQuery)
        .select('_id title slug shortDesc thumbnailImage category meta createdAt updatedAt')
        .populate({ path: 'category', select: '_id title' })
        .skip(skip)
        .limit(limit),
      this.newsModel.countDocuments(searchQuery),
    ])
    news.sort((a: any, b: any) => b.updatedAt - a.updatedAt)
    return {
      data: news,
      meta: {
        total,
        page,
        limit,
      },
    }
  }
  async getHighlightLists(): Promise<INews[]> {
    const news = await this.newsModel
      .find({ 'meta.isHighlight': true })
      .select('_id title slug shortDesc thumbnailImage category meta')
      .populate({ path: 'category', select: '_id title' })
      .sort({ createdAt: -1 })

    return news
  }

  async getAdminLists({
    q,
    page = 1,
    limit = 10,
    categories,
  }: {
    q?: string
    page?: number
    limit?: number
    categories?: string[]
  }): Promise<{
    data: INews[]
    meta: { total: number; page: number; limit: number }
  }> {
    const skip = (page - 1) * limit

    const searchQuery: FilterQuery<typeof this.newsModel> = {}

    if (q) {
      const regex = new RegExp(q, 'i')
      searchQuery.$or = [{ title: regex }]
    }
    if (categories && categories.length > 0) {
      searchQuery.category = { $in: categories }
    }
    const [news, total] = await Promise.all([
      this.newsModel
        .find(searchQuery)
        .select('_id title shortDesc thumbnailImage category status meta createdAt updatedAt')
        .populate({ path: 'category', select: '_id title' })
        .skip(skip)
        .limit(limit),
      this.newsModel.countDocuments(searchQuery),
    ])
    news.sort((a: any, b: any) => b.updatedAt - a.updatedAt)
    return {
      data: news,
      meta: {
        total,
        page,
        limit,
      },
    }
  }

  async getNewsBySlug(slug?: string): Promise<INews> {
    if (!slug) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    const news = await this.newsModel.findOne({ slug }).populate('category')
    if (!news) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeNews(news)
  }

  async getNewsById(id?: string): Promise<INews> {
    if (!id) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    const news = await this.newsModel.findById(id).populate('category')
    if (!news) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeNews(news)
  }

  async createNews(newsData: CreateNewsInput): Promise<INews> {
    const { title, shortDesc, content, category, coverImage, thumbnailImage, meta } = newsData ?? {}
    const slug = ConvertHelper.sanitizerSlug(title)
    // const htmlContent = ConvertHelper.sanitizerHtml(content)
    const createData = { title, slug, shortDesc, content, category, coverImage, thumbnailImage, meta }
    const news = await this.newsModel.create(createData)
    return this.sanitizeNews(news)
  }

  async updateNews(newsData: UpdateNewsInput): Promise<INews> {
    const { id, title, shortDesc, content, category, thumbnailImage, coverImage, meta } = newsData ?? {}
    const slug = ConvertHelper.sanitizerSlug(title)
    // const htmlContent = ConvertHelper.sanitizerHtml(content)
    const updateDate: Omit<UpdateNewsInput, 'id' | 'meta'> & { slug: string; meta?: object } = {
      title,
      slug,
      shortDesc: shortDesc ?? '',
      content,
      category,
      thumbnailImage,
      coverImage,
    }
    if (meta && Object.keys(meta).length > 0) {
      updateDate['meta'] = meta
    }
    const updatedNews = await this.newsModel.findByIdAndUpdate(id, updateDate, { new: true })
    if (!updatedNews) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeNews(updatedNews)
  }

  async deleteNewsById(id?: string): Promise<boolean> {
    await this.newsModel.findByIdAndDelete(id)
    return true
  }

  async updateStatusById(id?: string, status?: number): Promise<INews> {
    if (!id) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    const news = await this.newsModel.findById(id)
    if (!news) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    const updatedNews = await this.newsModel.findByIdAndUpdate(id, { status }, { new: true })
    if (!updatedNews) {
      throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeNews(updatedNews)
  }

  public sanitizeNews(news: NewsDocument): INews {
    const newsObject = news.toObject ? news.toObject() : news
    return newsObject
  }
}
