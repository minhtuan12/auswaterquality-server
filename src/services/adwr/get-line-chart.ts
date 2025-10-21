import ADWRModel from '../../models/adwr.model'

const getLineChart = async (params: { startYear: number; endYear: number; locationType: string; state: string }) => {
  const { startYear, endYear, locationType, state } = params

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
        $or: [
          { 'communityData.progress': { $exists: false } },
          { 'communityData.progress': '' },
        ]
      },
    },
    {
      $lookup: {
        from: 'states',
        localField: 'community.state',
        foreignField: '_id',
        as: 'state',
      },
    },
    { $unwind: '$state' },
    {
      $match: {
        year: { $gte: startYear, $lte: endYear },
      },
    },
  ]

  // Apply additional filters
  if (state !== 'All') {
    pipeline.push({ $match: { 'state.code': state } })
  }
  if (locationType !== 'All') {
    pipeline.push({ $match: { 'community.locationType': locationType } })
  }

  pipeline.push(
    {
      $group: {
        _id: {
          year: '$year',
          quality: '$quality',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.year',
        qualities: {
          $push: {
            k: '$_id.quality',
            v: '$count',
          },
        },
      },
    },
    {
      $project: {
        year: '$_id',
        good: { $ifNull: [{ $arrayElemAt: ['$qualities.v', { $indexOfArray: ['$qualities.k', 'good'] }] }, 0] },
        unhealthy: {
          $ifNull: [{ $arrayElemAt: ['$qualities.v', { $indexOfArray: ['$qualities.k', 'unhealthy'] }] }, 0],
        },
        unacceptable: {
          $ifNull: [{ $arrayElemAt: ['$qualities.v', { $indexOfArray: ['$qualities.k', 'unacceptable'] }] }, 0],
        },
      },
    },
    {
      $sort: { year: 1 },
    },
  )

  const rawData = await ADWRModel.aggregate(pipeline)

  return rawData
}

export default getLineChart
