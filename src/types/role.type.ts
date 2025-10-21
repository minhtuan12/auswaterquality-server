import { Document } from 'mongoose'
import { IAudit } from './audit.type'

export interface IRole extends IAudit {
  _id: string
  name: string
  permissions: string[]
}

export type RoleDocument = IRole & Document
