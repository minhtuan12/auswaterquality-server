import { Document } from 'mongoose'
import { IAudit } from './audit.type'

export interface ICategory extends IAudit {
  _id: string
  title: string
  status: number
}

export type CategoryDocument = ICategory & Document

export type CreateCategoryInput = Pick<ICategory, 'title'>

export type UpdateCategoryInput = Pick<ICategory, 'title'> & { id: string }
