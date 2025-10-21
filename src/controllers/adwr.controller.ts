import { Response } from 'express'
import ResponseHelper from '../utils/response.helper'
import { HttpStatusCode } from '../enums/httpCode.enum'
import ADWRModel from '../models/adwr.model'
import { AdwrService } from '../services/adwr/adwr.service'
import { ADWRQueryRequest, GisMapQuery } from '../types/adwr.type'
import CommunityService from "../services/community.service";

type GisMapRequestType = ADWRQueryRequest<GisMapQuery>
type ExceedancesTreeMapType = ADWRQueryRequest<{ year: number; locationType: string; location: string; state: string }>
type DotLightQualityType = ADWRQueryRequest<{ community: string }>

class ADWRController {
  private communityService: CommunityService;

  constructor() {
    this.gisMap = this.gisMap.bind(this)
    this.gisTreeMap = this.gisTreeMap.bind(this)
    this.scatterChart = this.scatterChart.bind(this)
    this.getLineChart = this.getLineChart.bind(this)
    this.parameterBarChart = this.parameterBarChart.bind(this)
    this.exceedancesTreeMap = this.exceedancesTreeMap.bind(this)
    this.dotLightQualityChart = this.dotLightQualityChart.bind(this)
    this.parameterFailedBarChart = this.parameterFailedBarChart.bind(this)
    this.percentageWaterQualityChart = this.percentageWaterQualityChart.bind(this)
    this.communityService = new CommunityService()
  }

  async gisMap(req: GisMapRequestType, res: Response) {
    const { year = 2008, state = 'All', community = 'All', locationType = 'All', progress = 'all', isDrinkingWater = false } = req.query
    try {
      const result = await AdwrService.getGisMapData({ year, state, community, locationType, isDrinkingWater })
      const dataProgress = await this.communityService.getCommunitiesWithProgress({ progress, state, community, locationType });
      return ResponseHelper.success(res, { adwg: result, progress: dataProgress }, 'GIS Map retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async gisTreeMap(req: GisMapRequestType, res: Response) {
    const { year = 2008, state = 'All', community = 'All', locationType = 'All' } = req.query
    try {
      const result = await AdwrService.getGisTreeMapData({ year, state, community, locationType })
      return ResponseHelper.success(res, result, 'GIS Map retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async scatterChart(
    req: ADWRQueryRequest<{ year: number; state: string[]; parameter: string; locationType: string }>,
    res: Response,
  ) {
    const { year = 2008, state = 'All', locationType = 'All', parameter = 'Aluminium' } = req.query
    try {
      const pipeline: any[] = [
        { $match: { year: Number(year) } },
        {
          $lookup: {
            from: 'communities',
            localField: 'community',
            foreignField: '_id',
            as: 'community',
          },
        },
        { $unwind: '$community' },
        {
          $lookup: {
            from: 'states',
            localField: 'community.state',
            foreignField: '_id',
            as: 'community.state',
          },
        },
        { $unwind: '$community.state' },
      ]
      if (state !== 'All') {
        pipeline.push({
          $match: { 'community.state.code': state },
        })
      }
      if (locationType !== 'All') {
        pipeline.push({
          $match: { 'community.locationType': locationType },
        })
      }
      if (parameter) {
        pipeline.push({
          $match: {
            $or: [
              { [`aestheticParameters.${parameter}`]: { $exists: true, $ne: null } },
              { [`healthParameters.${parameter}`]: { $exists: true, $ne: null } },
              { [`otherParameters.${parameter}`]: { $exists: true, $ne: null } },
            ],
          },
        })
      }

      pipeline.push({
        $project: {
          _id: 1,
          year: 1,
          community: {
            name: 1,
            state: {
              name: 1,
              code: 1,
            },
            locationType: 1,
          },
          aestheticParameters: {
            $ifNull: [`$aestheticParameters.${parameter}`, null],
          },
          healthParameters: {
            $ifNull: [`$healthParameters.${parameter}`, null],
          },
          otherParameters: {
            $ifNull: [`$otherParameters.${parameter}`, null],
          },
          quality: 1,
        },
      })

      const scatterCharts = await ADWRModel.aggregate(pipeline)
      return ResponseHelper.success(res, scatterCharts, 'Scatter chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async parameterBarChart(
    req: ADWRQueryRequest<{ community: string; parameterName: string; parameterType: string }>,
    res: Response,
  ) {
    const { community = 'Alice Springs', parameterName = 'Aluminium', parameterType = 'health' } = req.query
    try {
      if (!community || !parameterName || !parameterType) {
        throw new ResponseHelper('Invalid input', HttpStatusCode.BAD_REQUEST)
      }

      const isHealth = parameterType === 'health' || parameterType === 'all'
      const paramPath = `${isHealth ? 'healthParameters' :
        (parameterType === 'aesthetic' ? 'aestheticParameters' : 'otherParameters')}.${parameterName}`

      const records = await ADWRModel.aggregate([
        {
          $match: {
            [paramPath]: { $exists: true },
          },
        },
        {
          $lookup: {
            from: 'communities',
            localField: 'community',
            foreignField: '_id',
            as: 'community',
          },
        },
        { $unwind: '$community' },
        {
          $match: {
            'community.name': community,
          },
        },
        {
          $project: {
            year: 1,
            [paramPath]: 1,
            community: 1,
          },
        },
        { $sort: { year: 1 } },
      ])

      const result = records.map(record => {
        const param = isHealth
          ? record.healthParameters?.[parameterName]
          : (parameterType === 'aesthetic' ? record.aestheticParameters?.[parameterName] : record.otherParameters?.[parameterName]);

        const spls = param?.spls ?? 0;

        let spls_pass = null;
        let spls_excd = null;
        let pct = param?.pct ?? null;

        // Trường hợp 1: Có sẵn cả spls_pass và spls_excd → dùng luôn
        if (param?.spls_pass !== undefined && param?.spls_excd !== undefined) {
          spls_pass = param.spls_pass;
          spls_excd = param.spls_excd;
          pct = pct ?? (spls_pass > 0 ? (spls / spls_pass) * 100 : null);
        }
        // Trường hợp 2: Có spls_pass → tính spls_excd
        else if (param?.spls_pass !== undefined) {
          spls_pass = param.spls_pass;
          spls_excd = spls - spls_pass;
          pct = pct ?? (spls_pass > 0 ? (spls / spls_pass) * 100 : null);
        }
        // Trường hợp 3: Có spls_excd → tính spls_pass
        else if (param?.spls_excd !== undefined) {
          spls_excd = param.spls_excd;
          spls_pass = spls - spls_excd;
          pct = pct ?? (spls_pass > 0 ? (spls / spls_pass) * 100 : null);
        }
        // Trường hợp 4: Có pct → tính lại pass & excd
        else if (pct !== null) {
          spls_pass = spls * (pct / 100);
          spls_excd = spls - spls_pass;
        }
        // Trường hợp 5: Không có gì ngoài spls ⇒ giữ spls, bỏ pass/excd/pct
        else {
          spls_pass = null;
          spls_excd = null;
          pct = null;
        }

        if (parameterName === 'Ecoli' || parameterName === 'Coliforms') {
          return {
            year: record.year,
            pct: param?.pct ?? 0,
            spls,
            spls_excd,
            spls_pass,
          }
        }

        return {
          year: record.year,
          min: param?.min ?? 0,
          max: param?.max ?? 0,
          avg: param?.avg ?? 0,
          '95th': param?.['95th'] ?? 0,
          spls,
          spls_excd,
          spls_pass,
        }
      })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async dotLightQualityChart(req: DotLightQualityType, res: Response) {
    const { community = 'Alice Springs' } = req.query
    try {
      const result = await AdwrService.getDotLightQuality({ community })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async parameterFailedBarChart(req: ADWRQueryRequest<{ community: string }>, res: Response) {
    const { community = 'bc2ea07f-428e-4b2e-86e0-fa66c74eccfc' } = req.query
    try {
      if (!community) {
        throw new ResponseHelper('Invalid input', HttpStatusCode.BAD_REQUEST)
      }

      const result = await ADWRModel.aggregate([
        {
          $match: {
            community,
          },
        },
        {
          $lookup: {
            from: 'communities',
            localField: 'community',
            foreignField: '_id',
            as: 'communityData'
          }
        },
        { $unwind: '$communityData' },
        {
          $match: {
            $or: [
              { 'communityData.progress': { $exists: false } },
              { 'communityData.progress': '' },
            ]
          }
        },
        {
          $project: {
            year: 1,
            allParameters: {
              $mergeObjects: ['$heathParameters', '$aestheticParameters'],
            },
          },
        },
        {
          $addFields: {
            filteredParams: {
              $map: {
                input: { $objectToArray: '$allParameters' },
                as: 'param',
                in: {
                  $cond: [{ $eq: ['$$param.v.rpt', 'N'] }, { k: '$$param.k', v: '$$param.v' }, false],
                },
              },
            },
          },
        },
        {
          $project: {
            year: 1,
            filteredParams: {
              $filter: {
                input: '$filteredParams',
                as: 'item',
                cond: { $ne: ['$$item', false] },
              },
            },
          },
        },
      ])

      const paramMap = new Map()

      for (const item of result) {
        const { year, filteredParams } = item
        for (const param of filteredParams) {
          const paramName = param.k

          if (!paramMap.has(paramName)) {
            paramMap.set(paramName, [])
          }

          paramMap.get(paramName).push({
            year,
            ...param.v,
          })
        }
      }

      const resultData = Array.from(paramMap.entries()).map(([parameterName, data]) => ({
        parameterName,
        data,
      }))

      return ResponseHelper.success(res, resultData, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async exceedancesTreeMap(req: ExceedancesTreeMapType, res: Response) {
    const { year = 2008, locationType = 'All', state = 'All', location = 'All' } = req.query

    try {
      const result = await AdwrService.getExceedanceTreeMap({ year, locationType, state, location })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async percentageWaterQualityChart(
    req: ADWRQueryRequest<{ year: number; locationType: string; state: string }>,
    res: Response,
  ) {
    const { year = 2008, locationType = 'All', state = 'All' } = req.query
    try {
      const result = await AdwrService.getPercentageWaterQuality({ year, locationType, state })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async qualityTimeRangeBarChart(
    req: ADWRQueryRequest<{
      startYear: number
      endYear: number
      locationType: string
      state: string
    }>,
    res: Response,
  ) {
    const { startYear = 2008, endYear = 2012, locationType = 'All', state = 'All' } = req.query
    try {
      const result = await AdwrService.getQualityByTimeRange({
        startYear: Number(startYear),
        endYear: Number(endYear),
        locationType,
        state,
      })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getLineChart(
    req: ADWRQueryRequest<{
      startYear: number
      endYear: number
      locationType: string
      state: string
    }>,
    res: Response,
  ) {
    const { startYear = 2008, endYear = 2012, locationType = 'All', state = 'All' } = req.query
    try {
      const result = await AdwrService.getLineChart({
        startYear: Number(startYear),
        endYear: Number(endYear),
        locationType,
        state,
      })

      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }

  async getRangeOfYear(
    req: ADWRQueryRequest<{
      locationType: string
      state: string
      community: string
    }>,
    res: Response,
  ) {
    const { locationType = 'All', state = 'All', community = 'All' } = req.query
    try {
      const result = await AdwrService.getRangeOfYear({ locationType, state, community })
      return ResponseHelper.success(res, result, 'Chart retrieved successfully')
    } catch (error: any) {
      const err = error as { message: string; status?: number }
      const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
      ResponseHelper.error(res, err.message, status)
    }
  }
}

export const adwrController = new ADWRController()
