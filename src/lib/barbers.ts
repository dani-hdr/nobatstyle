import type { Where } from 'payload'

import type { Barber, City } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type ListBarber = {
  id: string
  shopName: string
  rating?: number | null
  reviewCount?: number | null
  createdAt: string
  /** Avatar lives on the barber's linked user, not on the barber itself. */
  user?: { avatar?: ({ url?: string | null; alt?: string | null } | string | number | null) | null } | string | number | null
  city?: ({ id: string; name: string; province?: City['province'] | null } | string | null) | null
}

export const BARBERS_PAGE_SIZE = 9

export type BarberFilters = {
  q?: string
  city?: string
  service?: string
  page?: number
}

/**
 * Queries barbers for the listing page with optional filters (search query,
 * city, service) and pagination, sorted by rating.
 */
export async function getBarbers({
  q,
  city,
  service,
  page = 1,
}: BarberFilters): Promise<{ docs: ListBarber[]; total: number; totalPages: number }> {
  const payload = await getPayload({ config })

  const and: Where[] = []
  if (q?.trim()) and.push({ shopName: { contains: q.trim() } })
  if (city) and.push({ city: { equals: city } })
  if (service) and.push({ services: { equals: service } })
  const where: Where = and.length > 1 ? { and } : and[0]

  const { docs, totalDocs, totalPages } = await payload.find({
    collection: 'barbers',
    where,
    sort: '-rating',
    limit: BARBERS_PAGE_SIZE,
    page,
    // depth 2 so barber.user.avatar (media) is populated.
    depth: 2,
  })

  return {
    docs: docs.map((d) => ({
      id: d.id,
      shopName: d.shopName,
      rating: d.rating,
      reviewCount: d.reviewCount,
      createdAt: d.createdAt,
      user: d.user,
      city: d.city,
    })),
    total: totalDocs,
    totalPages,
  }
}
