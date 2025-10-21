import { Request, Response } from 'express'
import { HttpStatusCode } from '../enums/httpCode.enum'
import ResponseHelper from '../utils/response.helper'
import ExcelJS from 'exceljs'
import { ADWRModel } from '../models'
import { ADWRDocument } from '../types/adwr.type'

const STATES = ['NT', 'SA', 'WA', 'VIC']
const HEALTH_PARAMETERS = ['Antinomy', 'Arsenic']
const PARAMETER_VALUES: { [key: string]: string } = {
  '95th': '95th',
  rpt: 'ADWG_rpt',
  rpt_new: 'ADWG_rpt_new',
  max: 'Max',
  min: 'Min',
  avg: 'Avg',
  sd: 'Sd',
  spls: 'Spls',
  spls_dl: 'Spls_Dl',
  spls_excd: 'Spls_excd',
}

class ExcelController {
  private readonly adwrModel
  constructor() {
    this.adwrModel = ADWRModel
    this.getAccessData = this.getAccessData.bind(this)
  }

  getFullParameterName({ data, prefix }: { data: ADWRDocument; prefix: string }) {
    if (!data) {
      return {}
    }
    const results: { [key: string]: unknown } = {}
    Object.entries(data).forEach(([a, b]) => {
      Object.entries(b).forEach(([c, d]) => {
        const keyName = `${prefix}_${a}_${PARAMETER_VALUES[c]}`
        results[keyName] = d
      })
    })
    return results
  }

  createSheet({ workbook, state, parameterType, data }: any) {
    const worksheet = workbook.addWorksheet(`${state}_${parameterType}`)

    // Add headers
    const headers = [
      { header: 'Year', key: 'year', width: 10 },
      { header: 'State', key: 'stateName', width: 10 },
      { header: 'Community', key: 'communityName', width: 20 },
    ]

    HEALTH_PARAMETERS.forEach(item => {
      Object.values(PARAMETER_VALUES).forEach(value => {
        const headerName = `${parameterType === 'Health' ? 'H' : 'A'}_${item}_${value}`
        headers.push({ header: headerName, key: headerName, width: 10 })
      })
    })

    worksheet.columns = headers
    // Add data rows
    worksheet.addRows(data)
  }

  async getAccessData(req: Request, res: Response) {
    try {
      //   const { username, password } = req.body
      const results = (await this.adwrModel.find({ year: 2009 }).populate({
        path: 'community',
        select: '_id name state region',
        populate: {
          path: 'state',
          select: '_id name code',
        },
      })) as any
      const statesData: { [key: string]: any[] } = { NT: [], SA: [], WA: [], VIC: [] }
      results.forEach((item: any) => {
        const healthyParameters = this.getFullParameterName({ data: item.healthyParameters, prefix: 'H' })
        const aestheticParameters = this.getFullParameterName({ data: item.aestheticParameters, prefix: 'A' })
        const convertData = {
          year: item.year,
          stateName: item.community.state.code,
          communityName: item.community.name,
          ...healthyParameters,
          ...aestheticParameters,
        }
        statesData[item.community.state.code].push(convertData)
      })
      ResponseHelper.success(res, statesData, 'Oke', 200)

      //   const workbook = new ExcelJS.Workbook()
      //   STATES.forEach(state => {
      //     const healthStateData = statesData[state]
      //     const aestheticStateData = statesData[state]
      //     this.createSheet({ workbook, state, parameterType: 'Health', data: healthStateData })
      //     this.createSheet({ workbook, state, parameterType: 'Aesthetic', data: aestheticStateData })
      //   })

      //   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      //   res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx')

      //   await workbook.xlsx.write(res)

      //   res.end()
    } catch (error: any) {
      const status = error.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, error.message, status)
    }
  }
}

export const excelController = new ExcelController()
