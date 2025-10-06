import { Document } from 'mongoose'
import { Request } from 'express'
import { IAudit } from './audit.type'
import { IRole } from './role.type'

export interface IUser extends IAudit {
  _id?: string
  username: string
  password: string
  role: string
}

export type UserDocument = IUser & Document

export type CreateUserInput = Pick<IUser, 'username' | 'password' | 'role'>

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'username' | 'password'>>

export type UserOutput = Omit<IUser, 'password'>

export type UserRole = UserOutput & {
  role: IRole
}

export type LoginInput = {
  username: string
  password: string
}

export type AuthResponse = {
  user: UserOutput
  token: string
}

export interface AuthRequest extends Request {
  user: UserRole
}
