import type { City } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Loads all active cities for the hero search city filter. Returns an empty
 * list when the collection has no active cities configured yet.
 */
export async function getCities(): Promise<Pick<City, 'id' | 'name'>[]> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'cities',
    where: { isActive: { equals: true } },
    sort: 'name',
    limit: 100,
    depth: 0,
  })

  return docs.map(({ id, name }) => ({ id, name }))
}
