import { CloudinaryHelper } from './../utils/cloudinary.helper'
import { Response, Request } from 'express'
import NewsService from '../services/news.service'
import { CreateNewsInput, StatusNewsInput } from '../types/news.type'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import CategoryService from '../services/category.service'
import { ResponseDetailParams } from '../types/general.type'
import { ValidatorHelper, ValidatorSchema } from '../utils/validator.helper'

const COMMON_VARIABLES: { [key: string]: number } = {
  thumbnailSize: 2,
  coverImageSize: 2,
}

type GetListRequest = Request<
  object,
  object,
  object,
  { q: string; page: string; limit: string; categories: string[] },
  object
>

type MulterFileRequest = Express.Multer.File & { url?: string }

class NewsController {
  private readonly newsService
  private readonly categoryService
  constructor() {
    this.newsService = new NewsService()
    this.categoryService = new CategoryService()
    this.getLists = this.getLists.bind(this)
    this.getHighlightLists = this.getHighlightLists.bind(this)
    this.getAdminLists = this.getAdminLists.bind(this)
    this.getDetail = this.getDetail.bind(this)
    this.getAdminDetail = this.getAdminDetail.bind(this)
    this.fileUpload = this.fileUpload.bind(this)
    this.createNews = this.createNews.bind(this)
    this.updateNews = this.updateNews.bind(this)
    this.deleteNews = this.deleteNews.bind(this)
    this.publishNews = this.publishNews.bind(this)
    this.unpublishNews = this.unpublishNews.bind(this)
    this.requestPublishNews = this.requestPublishNews.bind(this)
  }

  async getLists(req: GetListRequest, res: Response) {
    const q = req.query.q?.toLowerCase() || ''
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const categories = req.query.categories
    try {
      const news = await this.newsService.getLists({ q, page, limit, categories })
      return ResponseHelper.paginated(res, news.data, news.meta, 'News retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getAdminLists(req: GetListRequest, res: Response) {
    const q = req.query.q?.toLowerCase() || ''
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const categories = req.query.categories
    try {
      const news = await this.newsService.getAdminLists({ q, page, limit, categories })
      return ResponseHelper.paginated(res, news.data, news.meta, 'News retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getHighlightLists(req: GetListRequest, res: Response) {
    try {
      const news = await this.newsService.getHighlightLists()
      return ResponseHelper.success(res, news, 'News retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getDetail(req: Request, res: Response) {
    const { slug } = req.params
    try {
      const news = await this.newsService.getNewsBySlug(slug)
      return ResponseHelper.success(res, news, 'News retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getAdminDetail(req: Request, res: Response) {
    const { id } = req.params
    try {
      const news = await this.newsService.getNewsById(id)
      return ResponseHelper.success(res, news, 'News retrieved successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async createNews(
    req: Request<
      object,
      object,
      CreateNewsInput & { startDate: string; endDate: string; location: string },
      object,
      object
    >,
    res: Response,
  ) {
    const { title, shortDesc, content, category, startDate, endDate, location } = req.body
    const files = req.files as {
      thumbnailImage?: Express.Multer.File[]
      coverImage?: Express.Multer.File[]
    }
    try {
      let thumbnailImageUrl: string | undefined = undefined
      let coverImageUrl: string | undefined = undefined

      const thumbnail = files?.thumbnailImage?.[0]
      if (thumbnail) {
        if (thumbnail.size > COMMON_VARIABLES.thumbnailSize * 1024 * 1024) {
          throw new ResponseHelper(
            `Thumbnail image bigger than ${COMMON_VARIABLES.coverImageSize}MB`,
            HttpStatusCode.BAD_REQUEST,
          )
        } else {
          const result = await CloudinaryHelper.upload(thumbnail.buffer, thumbnail.originalname)
          thumbnailImageUrl = (result as any).secure_url
        }
      }

      const cover = files?.coverImage?.[0]
      if (cover) {
        if (cover.size > COMMON_VARIABLES.coverImageSize * 1024 * 1024) {
          throw new ResponseHelper(
            `Cover image bigger than ${COMMON_VARIABLES.coverImageSize}MB`,
            HttpStatusCode.BAD_REQUEST,
          )
        } else {
          const result = await CloudinaryHelper.upload(cover.buffer, cover.originalname)
          coverImageUrl = (result as any).secure_url
        }
      }
      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createNews)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      const validData: any = {
        title,
        shortDesc,
        content: JSON.parse(content) || [],
        category,
        coverImage: coverImageUrl,
        thumbnailImage: thumbnailImageUrl,
        meta: {},
      }
      if (startDate && endDate) {
        validData['meta'] = { startDate, endDate }
      }
      if (location) {
        validData['meta']['location'] = location
      }
      const news = await this.newsService.createNews(validData)
      return ResponseHelper.success(res, news, 'Created news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getImageUrl(data: MulterFileRequest | undefined, validator: string) {
    if (data) {
      if (data.size > COMMON_VARIABLES[validator] * 1024 * 1024) {
        throw new ResponseHelper(
          `Thumbnail image bigger than ${COMMON_VARIABLES[validator]}MB`,
          HttpStatusCode.BAD_REQUEST,
        )
      } else {
        const result = await CloudinaryHelper.upload(data.buffer, data.originalname)
        return (result as any).secure_url
      }
    }
    return undefined
  }

  async updateNews(
    req: Request<
      ResponseDetailParams,
      object,
      CreateNewsInput & {
        startDate: string
        endDate: string
        deleteThumbnail?: string
        deleteCover?: string
        location: string
      },
      object,
      object
    >,
    res: Response,
  ) {
    const { id } = req.params
    const { title, shortDesc, content, category, startDate, endDate, deleteThumbnail, deleteCover, location } = req.body
    const files = req.files as {
      thumbnailImage?: MulterFileRequest[]
      coverImage?: MulterFileRequest[]
    }
    try {
      const thumbnail = files?.thumbnailImage?.[0]
      const thumbnailImageUrl: string | undefined = !deleteThumbnail
        ? await this.getImageUrl(thumbnail, 'thumbnailImageSize')
        : 'REMOVE'

      const cover = files?.coverImage?.[0]
      const coverImageUrl: string | undefined = !deleteCover
        ? await this.getImageUrl(cover, 'coverImageSize')
        : 'REMOVE'

      const validator = ValidatorHelper.scan(req.body, ValidatorSchema.createNews)
      if (!validator.success) {
        throw new ResponseHelper(validator.message, HttpStatusCode.BAD_REQUEST)
      }
      // Check category exist
      await this.categoryService.getCategoryById(category)

      const newsDetail = await this.newsService.getNewsById(id)
      if (!newsDetail) {
        throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
      }
      if (cover && newsDetail?.coverImage) {
        await CloudinaryHelper.delete(CloudinaryHelper.getPublicIdFromUrl(newsDetail.coverImage))
      }
      if (thumbnail && newsDetail?.thumbnailImage) {
        await CloudinaryHelper.delete(CloudinaryHelper.getPublicIdFromUrl(newsDetail.thumbnailImage))
      }
      const validData: any = {
        id,
        title,
        shortDesc,
        content: JSON.parse(content) || [],
        category,
        coverImage: coverImageUrl === 'REMOVE' ? '' : coverImageUrl,
        thumbnailImage: thumbnailImageUrl === 'REMOVE' ? '' : thumbnailImageUrl,
        meta: {},
      }
      if (startDate && endDate) {
        validData['meta'] = { startDate, endDate }
      }
      if (location) {
        validData['meta']['location'] = location
      }
      const news = await this.newsService.updateNews(validData)
      return ResponseHelper.success(res, news, 'Updated news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async deleteNews(req: Request, res: Response) {
    const { id } = req.params
    try {
      const news = await this.newsService.getNewsById(id)
      if (!news) {
        throw new ResponseHelper('News not found', HttpStatusCode.NOT_FOUND)
      }
      if (news?.coverImage) {
        await CloudinaryHelper.delete(CloudinaryHelper.getPublicIdFromUrl(news.coverImage))
      }
      if (news?.thumbnailImage) {
        await CloudinaryHelper.delete(CloudinaryHelper.getPublicIdFromUrl(news.thumbnailImage))
      }
      await this.newsService.deleteNewsById(id)
      return ResponseHelper.success(res, {}, 'Deleted news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async publishNews(req: Request<ResponseDetailParams, object, StatusNewsInput, object, object>, res: Response) {
    const { id } = req.params
    try {
      const news = await this.newsService.updateStatusById(id, 2)
      return ResponseHelper.success(res, news, 'Published news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async requestPublishNews(req: Request<ResponseDetailParams, object, StatusNewsInput, object, object>, res: Response) {
    const { id } = req.params
    try {
      const news = await this.newsService.updateStatusById(id, 1)
      return ResponseHelper.success(res, news, 'Request publish news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async unpublishNews(req: Request<ResponseDetailParams, object, StatusNewsInput, object, object>, res: Response) {
    const { id } = req.params
    try {
      const news = await this.newsService.updateStatusById(id, 0)
      return ResponseHelper.success(res, news, 'Unpublished news successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async fileUpload(
    req: Request<object, object, CreateNewsInput & { startDate: string; endDate: string }, object, object>,
    res: Response,
  ) {
    const files = req.files as {
      file?: Express.Multer.File[]
    }
    try {
      let fileImageUrl: string | undefined = undefined

      const thumbnail = files?.file?.[0]
      if (thumbnail) {
        if (thumbnail.size > COMMON_VARIABLES.thumbnailSize * 1024 * 1024) {
          throw new ResponseHelper(`File bigger than ${COMMON_VARIABLES.coverImageSize}MB`, HttpStatusCode.BAD_REQUEST)
        } else {
          const result = await CloudinaryHelper.upload(thumbnail.buffer, thumbnail.originalname)
          fileImageUrl = (result as any).secure_url
        }
      }

      return ResponseHelper.success(res, fileImageUrl, 'Upload file successfully')
    } catch (error) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const newsController = new NewsController()
