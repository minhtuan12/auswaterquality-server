import { CommunityModel } from '../../models'
import ADWRModel from '../../models/adwr.model'
import { GisMapQuery } from '../../types/adwr.type'
import { VALID_AESTHETIC_PARAMETERS } from '../../utils/consts'

const getGisTreeMapData = async ({ year, state, community, locationType }: GisMapQuery) => {
  const foundCommunity: any = await CommunityModel.findOne({ name: community });
  if (foundCommunity?.progress) {
    return {
      waterSources: [foundCommunity?.waterSource ?? ''],
      waterProviders: [foundCommunity?.waterProvider ?? ''],
      dataSources: [foundCommunity?.dataSource ?? ''],
      aestheticParameters: {},
      healthParameters: {},
      region: foundCommunity?.region || '',
      dataPeriod: foundCommunity?.dataPeriod || '',
      progress: foundCommunity?.progress || ''
    }
  } else {
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

    if (locationType !== 'All') {
      pipeline.push({
        $match: { 'community.locationType': locationType },
      })
    }

    if (state !== 'All') {
      pipeline.push({
        $match: { 'community.state.code': state },
      })
    }

    if (community !== 'All') {
      pipeline.push({
        $match: { 'community.name': community },
      })
    }
    pipeline.push({
      $addFields: {
        healthParameters: {
          $arrayToObject: {
            $filter: {
              input: { $objectToArray: '$healthParameters' },
              as: 'param',
              cond: { $eq: ['$$param.v.rpt', 'N'] },
            },
          },
        },
        aestheticParameters: {
          $arrayToObject: {
            $filter: {
              input: { $objectToArray: '$aestheticParameters' },
              as: 'param',
              cond: {
                $and: [{ $in: ['$$param.k', VALID_AESTHETIC_PARAMETERS] }, { $eq: ['$$param.v.rpt', 'N'] }],
              },
            },
          },
        },
      },
    })
    const adwrList = await ADWRModel.aggregate(pipeline)
    const waterProviders: string[] = []
    const waterSources: string[] = []
    const dataSources: string[] = []
    const healthParameters: { [key: string]: number } = {}
    const aestheticParameters: { [key: string]: number } = {}

    adwrList.forEach(item => {
      const waterProvider = item.community?.waterProvider
      const waterSource = item.community?.waterSource
      const dataSource = item.community?.dataSource
      if (waterProvider && !waterProviders.includes(waterProvider)) {
        waterProviders.push(waterProvider)
      }
      if (waterSource && !waterSources.includes(waterSource)) {
        waterSources.push(waterSource)
      }
      if (dataSource && !dataSources.includes(dataSource)) {
        dataSources.push(dataSource)
      }
      if (item?.healthParameters) {
        Object.entries(item.healthParameters).forEach(([paramName, paramValue]) => {
          if ((paramValue as { rpt?: string })?.rpt === 'N') {
            if (healthParameters[paramName]) {
              healthParameters[paramName] += 1
            } else {
              healthParameters[paramName] = 1
            }
          }
        })
      }
      if (item?.aestheticParameters) {
        Object.entries(item.aestheticParameters).forEach(([paramName, paramValue]) => {
          if ((paramValue as { rpt?: string })?.rpt === 'N') {
            if (!VALID_AESTHETIC_PARAMETERS.includes(paramName)) {
              return
            }
            if (aestheticParameters[paramName]) {
              aestheticParameters[paramName] += 1
            } else {
              aestheticParameters[paramName] = 1
            }
          }
        })
      }
    })

    return { waterProviders, waterSources, dataSources, healthParameters, aestheticParameters }
  }
}

export default getGisTreeMapData
