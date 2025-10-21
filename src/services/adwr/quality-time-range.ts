import ADWRModel from '../../models/adwr.model'

const getQualityByTimeRange = async (params: {
  startYear: number
  endYear: number
  locationType: string
  state: string
}) => {
  const { startYear, endYear, locationType, state } = params
  const yearRange = endYear - startYear + 1
  const isShortPeriod = yearRange <= 5

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
    {
      $match: {
        year: { $gte: startYear, $lte: endYear },
        quality: { $in: ['unhealthy', 'unacceptable'] },
      },
    },
  ]

  if (state !== 'All') {
    pipeline.push({ $match: { 'state.code': state } })
  }
  if (locationType !== 'All') {
    pipeline.push({ $match: { 'community.locationType': locationType } })
  }

  pipeline.push(
    {
      $group: {
        _id: '$community._id',
        badYearsCount: { $sum: 1 },
        stateCode: { $first: '$state.code' },
        communityName: { $first: '$community.name' },
      },
    },
    {
      $project: {
        communityId: '$_id',
        badYearsCount: 1,
        stateCode: 1,
        communityName: 1,
        _id: 0,
      },
    },
  )

  const rawData = await ADWRModel.aggregate(pipeline)

  // Define bucket ranges based on period length
  const bucketDefinitions = isShortPeriod
    ? [
      { min: 1, max: 1, label: '1 year' },
      { min: 2, max: 2, label: '2 years' },
      { min: 3, max: 3, label: '3 years' },
      { min: 4, max: 4, label: '4 years' },
      { min: 5, max: 5, label: '5 years' },
    ]
    : [
      { min: 1, max: 1, label: '1 year' },
      { min: 2, max: 3, label: '>1-3 years' },
      { min: 4, max: 5, label: '>3-5 years' },
      { min: 6, max: 7, label: '>5-7 years' },
      { min: 8, max: 10, label: '>7-10 years' },
      { min: 11, max: Infinity, label: '>10 years' },
    ]

  // Filter out buckets that exceed our year range
  const applicableBuckets = bucketDefinitions.filter(bucket => bucket.min <= yearRange)

  // Count communities in each bucket
  const result = applicableBuckets
    .map(bucket => {
      const count = rawData.filter(item => item.badYearsCount >= bucket.min && item.badYearsCount <= bucket.max).length
      return {
        label: bucket.label,
        count,
      }
    })
    .filter(item => item.count > 0)

  return result
}

export default getQualityByTimeRange
