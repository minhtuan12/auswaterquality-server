import ADWRModel from '../../models/adwr.model'

const getExceedanceTreeMap = async ({
  year,
  locationType,
  state,
  location,
}: {
  year: number
  locationType: string
  state: string
  location: string
}) => {
  const isStateLocation = location === 'State'
  const isLocationType = location === 'Location Type'

  const pipeline = [
    { $match: { year: Number(year) } },
    // Join community
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
    // Join state
    {
      $lookup: {
        from: 'states',
        localField: 'community.state',
        foreignField: '_id',
        as: 'community.state',
      },
    },
    { $unwind: '$community.state' },
    // Filter by state
    ...(isStateLocation && state !== 'All' ? [{ $match: { 'community.state.code': state } }] : []),
    // Filter by locationType
    ...(isLocationType && locationType !== 'All' ? [{ $match: { 'community.locationType': locationType } }] : []),
    // Convert object to array
    {
      $project: {
        state: '$community.state.code',
        locationType: '$community.locationType',
        communityId: '$community._id',
        healthParameters: { $objectToArray: '$healthParameters' },
        aestheticParameters: { $objectToArray: '$aestheticParameters' },
      },
    },
    { $unwind: '$healthParameters' },
    { $unwind: '$aestheticParameters' },
    // Filter by rpt = "N"
    {
      $match: {
        $and: [{ 'healthParameters.v.rpt': 'N' }, { 'aestheticParameters.v.rpt': 'N' }],
      },
    },
    // Group
    {
      $group: {
        _id: isStateLocation && state === 'All' ? '$state' : 'global',
        healthParameters: {
          $push: {
            k: '$healthParameters.k',
            rpt: '$healthParameters.v.rpt',
            community: '$communityId',
          },
        },
        aestheticParameters: {
          $push: {
            k: '$aestheticParameters.k',
            rpt: '$aestheticParameters.v.rpt',
            community: '$communityId',
          },
        },
      },
    },
  ]

  const result = await ADWRModel.aggregate(pipeline)

  const finalResult = []

  for (const row of result) {
    const health: { [key: string]: Set<number> } = {}
    const aesthetic: { [key: string]: Set<number> } = {}

    // Group unique community count theo từng parameter
    for (const item of row.healthParameters) {
      if (item.rpt === 'N') {
        health[item.k] ??= new Set<number>()
        health[item.k].add(item.community)
      }
    }

    for (const item of row.aestheticParameters) {
      if (item.rpt === 'N') {
        aesthetic[item.k] ??= new Set()
        aesthetic[item.k].add(item.community)
      }
    }

    finalResult.push({
      ...(row._id !== 'global' ? { state: row._id } : {}),
      healthParameters: Object.fromEntries(Object.entries(health).map(([k, v]) => [k, v.size])),
      aestheticParameters: Object.fromEntries(Object.entries(aesthetic).map(([k, v]) => [k, v.size])),
    })
  }

  return finalResult
}

export default getExceedanceTreeMap
