import type { Where } from 'payload'

import type { Barber, City } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type ListBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  reviewCount?: number | null
  createdAt: string
  avatar?: ({ url?: string | null; alt?: string | null } | string | null) | null
  city?: ({ id: string; name: string; province?: City['province'] | null } | string | null) | null
}

export const BARBERS_PAGE_SIZE = 9

export type BarberFilters = {
  q?: string
  city?: string
  province?: string
  sort?: 'rating' | 'newest'
  page?: number
}

/**
 * Queries barbers for the listing page with optional filters (search query,
 * city, province, sort) and pagination. Returns active barbers only.
 */
export async function getBarbers({
  q,
  city,
  province,
  sort = 'rating',
  page = 1,
}: BarberFilters): Promise<{ docs: ListBarber[]; total: number; totalPages: number }> {
  const payload = await getPayload({ config })

  const and: Where[] = [{ isActive: { equals: true } }]
  if (q?.trim()) and.push({ shopName: { contains: q.trim() } })
  if (city) and.push({ city: { equals: city } })
  if (province) and.push({ 'city.province': { equals: province } })
  const where: Where = and.length > 1 ? { and } : and[0]

  const { docs, totalDocs, totalPages } = await payload.find({
    collection: 'barbers',
    where,
    sort: sort === 'newest' ? '-createdAt' : '-rating',
    limit: BARBERS_PAGE_SIZE,
    page,
    depth: 1,
  })

  return {
    docs: docs.map((d) => ({
      id: d.id,
      shopName: d.shopName,
      shopSlug: d.shopSlug,
      rating: d.rating,
      reviewCount: d.reviewCount,
      createdAt: d.createdAt,
      avatar: d.avatar,
      city: d.city,
    })),
    total: totalDocs,
    totalPages,
  }
}
