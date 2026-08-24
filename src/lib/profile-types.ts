/**
 * Client-safe types for the profile REST payloads returned by
 * /api/profile (GET) and consumed by the /profile page components.
 */

export type ProfileImage = {
  id: string
  url: string | null
  alt: string
}

export type ProfileUser = {
  id: string
  name: string | null
  username: string
  role: 'customer' | 'barber' | 'admin'
  createdAt: string
  avatar: ProfileImage | null
}

export type ProfileBarber = {
  id: string
  shopName: string
  shopSlug: string | null
  city: { id: string; name: string } | null
  cityId: string | null
  address: string | null
  phone: string | null
  about: string | null
  experienceYears: number
  cover: ProfileImage | null
  gallery: ProfileImage[]
  serviceIds: string[]
  rating: number
  reviewCount: number
}

export type CatalogService = {
  id: string
  name: string
}

export type ProfileData = {
  user: ProfileUser
  barber: ProfileBarber | null
  servicesCatalog?: CatalogService[]
}

/** Body accepted by PATCH /api/profile. */
export type ProfileUpdateBody = {
  name?: string | null
  avatarId?: string | null
  shop?: {
    shopName?: string
    shopSlug?: string
    cityId?: string | null
    address?: string | null
    phone?: string | null
    about?: string | null
    experienceYears?: number
    coverId?: string | null
    galleryIds?: string[]
    serviceIds?: string[]
  } | null
}
