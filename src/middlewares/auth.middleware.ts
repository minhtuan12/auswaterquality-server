import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, UserRole } from '../types/user.type'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { EnvironmentHelper } from '../utils/environment.helper'
import { ErrorMessage } from '../enums/error.enum'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest
  const authHeader = authReq.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseHelper.error(res, 'Unauthorized', HttpStatusCode.UNAUTHORIZED)
  }

  const token = authHeader.split(' ')[1]

  try {
    const jwtSecret = EnvironmentHelper.getJWTSecret()
    const decoded = jwt.verify(token, jwtSecret)
    authReq.user = decoded as UserRole
    next()
  } catch (error: any) {
    const err = error as { name?: string; message: string; status?: number }
    if (err.name === ErrorMessage.TOKEN_EXPIRED_ERROR) {
      return ResponseHelper.error(res, 'Unauthorized', HttpStatusCode.UNAUTHORIZED)
    }
    const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
    return ResponseHelper.error(res, err.message, status)
  }
}
