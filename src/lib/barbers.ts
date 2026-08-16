import type { Where } from 'payload'

import type { Barber } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type ListBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  reviewCount?: number | null
  avatar?: ({ url?: string | null; alt?: string | null } | string | null) | null
  city?: ({ id: string; name: string } | string | null) | null
}

/**
 * Queries barbers for the listing page, optionally filtered by a search query
 * (shop name) and a city id. Returns active barbers.
 */
export async function getBarbers({
  q,
  city,
}: {
  q?: string
  city?: string
}): Promise<{ docs: ListBarber[]; total: number }> {
  const payload = await getPayload({ config })

  const and: Where[] = [{ isActive: { equals: true } }]
  if (q?.trim()) and.push({ shopName: { contains: q.trim() } })
  if (city) and.push({ city: { equals: city } })
  const where: Where = and.length > 1 ? { and } : and[0]

  const { docs, totalDocs } = await payload.find({
    collection: 'barbers',
    where,
    sort: '-rating',
    limit: 50,
    depth: 1,
  })

  return {
    docs: docs.map((d) => ({
      id: d.id,
      shopName: d.shopName,
      shopSlug: d.shopSlug,
      rating: d.rating,
      reviewCount: d.reviewCount,
      avatar: d.avatar,
      city: d.city,
    })),
    total: totalDocs,
  }
}
