import ADWRModel from '../../models/adwr.model'
import { GisMapQuery } from '../../types/adwr.type'
import { VALID_AESTHETIC_PARAMETERS } from '../../utils/consts'

const getGisMapData = async ({ year, state, community, locationType, isDrinkingWater }: GisMapQuery) => {
  const condition = isDrinkingWater ? [{
    $match: {
      $or: [
        { 'community.progress': { $exists: false } },
        { 'community.progress': '' },
      ]
    },
  }] : [];

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
    ...condition,
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

  pipeline.push({
    $project: {
      _id: 1,
      community: { _id: 1, name: 1, state: { _id: 1, code: 1, name: 1 }, latitude: 1, longitude: 1, locationType: 1 },
      quality: 1,
      year: 1,
      healthParameters: 1,
      aestheticParameters: 1,
    },
  })
  const adwrList = await ADWRModel.aggregate(pipeline)

  return adwrList
}

export default getGisMapData
