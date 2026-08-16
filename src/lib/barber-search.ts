import { cache } from 'react'

import { PROVINCE_LABELS } from '@/data/iran-provinces'
import type { City } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type SearchCity = {
  id: string
  name: string
  province: City['province']
}

export type ProvinceGroup = {
  province: City['province']
  label: string
  cities: SearchCity[]
}

/**
 * Loads all active cities for the hero search city filter, grouped and sorted
 * by province. Returns an empty list when the collection has no active cities.
 */
export const getCities = cache(
  async function getCities(): Promise<ProvinceGroup[]> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'cities',
    where: { isActive: { equals: true } },
    sort: 'province',
    limit: 1000,
    depth: 0,
  })

  const groups = new Map<City['province'], SearchCity[]>()
  for (const { id, name, province } of docs) {
    const list = groups.get(province) ?? []
    list.push({ id, name, province })
    groups.set(province, list)
  }

  return [...groups.entries()].map(([province, cities]) => ({
    province,
    label: PROVINCE_LABELS[province] ?? province,
    cities,
  }))
  },
)
