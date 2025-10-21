import { Response } from 'express'
import { HttpStatusCode } from '../enums/httpCode.enum'

export default class ResponseHelper extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }

  public static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK,
  ) {
    this.sendResponse(res, true, statusCode, message, data)
  }

  public static error(
    res: Response,
    message: string = 'Error',
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  ) {
    this.sendResponse(res, false, statusCode, message, null)
  }

  public static sendWithoutData(
    res: Response,
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK,
  ) {
    this.sendResponse(res, true, statusCode, message, null)
  }

  public static paginated<T>(
    res: Response,
    data: T,
    meta: {
      total: number
      page: number
      limit: number
    },
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK,
  ) {
    this.sendResponse(res, true, statusCode, message, { data, meta })
  }

  private static sendResponse<T>(
    res: Response,
    success: boolean,
    statusCode: HttpStatusCode,
    message: string,
    data: T | null,
  ) {
    res.status(statusCode).json({
      success,
      message,
      data,
    })
  }
}
