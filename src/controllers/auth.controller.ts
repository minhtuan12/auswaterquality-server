import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import UserService from '../services/user.service'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import { EnvironmentHelper } from '../utils/environment.helper'
import { RegexHelper } from '../utils/regex.helper'

class AuthController {
  private readonly userService

  constructor() {
    this.userService = new UserService()
    this.login = this.login.bind(this)
    this.signUp = this.signUp.bind(this)
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      if (!username || !password) {
        return ResponseHelper.error(res, 'Invalid username or password', HttpStatusCode.UNAUTHORIZED)
      }

      const user = await this.userService.isUserExist(username)
      if (!user) {
        return ResponseHelper.error(res, 'Invalid username or password', HttpStatusCode.UNAUTHORIZED)
      }
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return ResponseHelper.error(res, 'Invalid username or password', HttpStatusCode.UNAUTHORIZED)
      }
      const jwtSecret = EnvironmentHelper.getJWTSecret()
      const token = jwt.sign(this.userService.sanitizeUser(user), jwtSecret, {
        expiresIn: '1d',
      })

      return ResponseHelper.success(
        res,
        {
          accessToken: token,
          expiredAt: Date.now() + 24 * 60 * 60 * 1000,
        },
        'Login successful',
      )
    } catch (error: any) {
      const status = error.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, error.message, status)
    }
  }

  async signUp(req: Request, res: Response) {
    try {
      const { username, password, role, allowedKey } = req.body
      const allowedKeyEnv = EnvironmentHelper.getAllowedKey()
      if (!allowedKey || allowedKey !== allowedKeyEnv) {
        return ResponseHelper.error(res, "You don't have permission to do this action", HttpStatusCode.FORBIDDEN)
      }
      if (!username || !password || !role) {
        return ResponseHelper.error(res, 'Username, password and role is required', HttpStatusCode.BAD_REQUEST)
      }
      if (!RegexHelper.password.test(password)) {
        return ResponseHelper.error(
          res,
          'Password contain at least 1 uppercase, 1 lowercase and 8 character',
          HttpStatusCode.BAD_REQUEST,
        )
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUser = await this.userService.create({ username, password: hashedPassword, role })
      return ResponseHelper.success(res, createUser, 'Sign up successful')
    } catch (error: any) {
      const status = error.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, error.message, status)
    }
  }
}

export const authController = new AuthController()
