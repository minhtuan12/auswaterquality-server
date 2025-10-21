import { IAudit } from './audit.type'
import { Request } from 'express'

export interface IAdWR extends IAudit {
  _id: string
  year: number
  community: string
  healthParameters: { [key: string]: { [parameter: string]: string } }
  aestheticParameters: { [key: string]: { [parameter: string]: string } }
  quality: 'good' | 'unhealthy' | 'unacceptable'
}

export type ADWRDocument = IAdWR & Document

export type ADWRQueryRequest<T> = Request<object, object, object, T, object>

export interface IParameter extends IAudit {
  _id: string
  type: string
  name: string
  displayName: string
  threshold1_11: string | null;
  threshold2_11: string | null;
  threshold3_11: string | null;
  threshold1_04: string | null;
  threshold2_04: string | null;
  threshold1_96: string | null;
  threshold2_96: string | null;
  units: string | null;
}

export type GisMapQuery = {
  year: number
  state: string
  community: string
  locationType: string,
  progress?: string,
  isDrinkingWater?: boolean
}

// export type
