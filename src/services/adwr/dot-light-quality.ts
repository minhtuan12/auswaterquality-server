import ADWRModel from '../../models/adwr.model'
import { VALID_AESTHETIC_PARAMETERS } from '../../utils/consts'

const getDotLightQuality = async ({ community }: { community: string }) => {
  const pipeline: any[] = [
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
        $or: [
          { 'communityData.progress': { $exists: false } },
          { 'communityData.progress': '' },
        ]
      },
    },
    {
      $match: {
        'community.name': community,
      },
    },
    {
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
    },
    {
      $project: {
        year: 1,
        allParameters: {
          $mergeObjects: ['$heathParameters', '$aestheticParameters'],
        },
        quality: 1,
      },
    },
    {
      $addFields: {
        failedParams: {
          $map: {
            input: { $objectToArray: { $ifNull: ['$allParameters', {}] } },
            as: 'param',
            in: '$$param.k',
          },
        },
      },
    },

    {
      $project: {
        year: 1,
        failedParams: 1,
        quality: 1,
      },
    },
    { $sort: { year: 1 } },
  ]

  const records = await ADWRModel.aggregate(pipeline)

  return records
}

export default getDotLightQuality
