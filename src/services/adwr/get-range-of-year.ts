import ADWRModel from '../../models/adwr.model'

type GetRangeOfYearParameters = {
  state: string
  locationType: string
  community: string
}

const getRangeOfYear = async ({ state, locationType, community }: GetRangeOfYearParameters) => {
  const isAllState = state === 'All'
  const isAllLocationType = locationType === 'All'
  if (isAllState && isAllLocationType) {
    return { minYear: 2005, maxYear: 2023, years: [2005, 2023] }
  }
  if (state === 'NT') {
    return { minYear: 2004, maxYear: 2023, years: [2004, 2023] }
  }
  if (state === 'WA') {
    return { minYear: 2008, maxYear: 2023, years: [2008, 2023] }
  }
  if (state === 'SA' || state === 'VIC' || !isAllLocationType) {
    return { minYear: 2002, maxYear: 2024, years: [2002, 2024] }
  }
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
  const adwrList = await ADWRModel.aggregate(pipeline)
  const years: number[] = []
  adwrList.forEach(item => {
    if (!years.includes(item.year)) {
      years.push(item.year)
    }
  })
  const data = years.sort((a, b) => a - b)
  const result = { minYear: data[0], maxYear: data[data.length - 1], years: data }

  return result
}

export default getRangeOfYear
