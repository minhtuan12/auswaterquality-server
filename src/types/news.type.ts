import { Document } from 'mongoose'
import { IAudit } from './audit.type'

export interface INews extends IAudit {
  _id: string
  title: string
  slug: string
  thumbnailImage?: string
  coverImage?: string
  shortDesc: string
  content: string
  category: string
  status: number
  meta: object
}

export type NewsDocument = INews & Document

export type CreateNewsInput = Pick<
  INews,
  'title' | 'shortDesc' | 'content' | 'category' | 'coverImage' | 'thumbnailImage' | 'meta'
>

export type StatusNewsInput = Pick<INews, 'title' | 'shortDesc' | 'content' | 'category'>

export type UpdateNewsInput = CreateNewsInput & { id: string }
