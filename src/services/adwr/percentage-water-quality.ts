import ADWRModel from '../../models/adwr.model'

const getPercentageWaterQuality = async ({
  year,
  locationType,
  state,
}: {
  year: number
  locationType: string
  state: string
}) => {
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
      $match: {
        $or: [
          { 'community.progress': { $exists: false } },
          { 'community.progress': '' },
        ]
      }
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
  ]
  // --- Filtering
  if (state !== 'All') {
    pipeline.push({ $match: { 'state.code': state } })
  }
  if (locationType !== 'All') {
    pipeline.push({ $match: { 'community.locationType': locationType } })
  }
  // --- Grouping
  pipeline.push({
    $group: {
      _id: null,
      total: { $sum: 1 },
      good: {
        $sum: { $cond: [{ $eq: ['$quality', 'good'] }, 1, 0] },
      },
      unhealthy: {
        $sum: { $cond: [{ $eq: ['$quality', 'unhealthy'] }, 1, 0] },
      },
      unacceptable: {
        $sum: { $cond: [{ $eq: ['$quality', 'unacceptable'] }, 1, 0] },
      },
    },
  })
  pipeline.push({
    $project: {
      state: '$_id',
      _id: 0,
      good: {
        $concat: [{ $toString: { $round: [{ $multiply: [{ $divide: ['$good', '$total'] }, 100] }, 1] } }],
      },
      unhealthy: {
        $concat: [{ $toString: { $round: [{ $multiply: [{ $divide: ['$unhealthy', '$total'] }, 100] }, 1] } }],
      },
      unacceptable: {
        $concat: [{ $toString: { $round: [{ $multiply: [{ $divide: ['$unacceptable', '$total'] }, 100] }, 1] } }],
      },
    },
  })

  const result = await ADWRModel.aggregate(pipeline)

  return result
}

export default getPercentageWaterQuality
