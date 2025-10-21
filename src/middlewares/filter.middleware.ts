import { Response, Request, NextFunction } from 'express'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { AuthRequest } from '../types/user.type'
import ResponseHelper from '../utils/response.helper'

export const filterMiddleware = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user

    if (!user || !user.role || !Array.isArray(user.role.permissions)) {
      return ResponseHelper.error(res, 'Access denied', HttpStatusCode.FORBIDDEN)
    }

    if (!user.role.permissions.includes(requiredPermission)) {
      return ResponseHelper.error(res, 'Access denied', HttpStatusCode.FORBIDDEN)
    }

    next()
  }
}
