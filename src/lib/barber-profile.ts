/**
 * UI-facing types + shared helpers for the Barber single page.
 *
 * This module must stay free of any server/Payload imports because client
 * components import it. Server-side data fetching lives in
 * `barber-profile.server.ts` and maps DB documents onto these types.
 */

export type BarberImage = {
  url: string
  alt: string
}

export type BarberStatIcon = 'slots' | 'satisfaction' | 'reviews' | 'experience'

export type BarberStat = {
  label: string
  value: string
  icon?: BarberStatIcon
}

export type BarberService = {
  id: string
  name: string
  description?: string
  /** Duration in minutes (derived from appointment windows; may be unknown) */
  durationMinutes?: number
  price?: number | null
  popular?: boolean
  image?: BarberImage
  remainingSlots?: number
}

export type BarberComment = {
  id: string
  authorName: string
  rating?: number
  text: string
  /** ISO date */
  date: string
}

export type BarberProfile = {
  id: string
  slug: string
  shopName: string
  barberName?: string
  rating: number
  ratingMax: number
  reviewCount: number
  city: string
  region?: string
  address: string
  coordinates?: { lat: number; lng: number }
  phone?: string
  avatar?: BarberImage
  coverImage: BarberImage
  gallery: BarberImage[]
  /** The signed-in visitor is one of this barber's customers. */
  isYourBarber?: boolean
  statusNote?: string
  about?: string
  stats: BarberStat[]
  services: BarberService[]
  comments: BarberComment[]
  /** Total active comments (comments holds only the first page). */
  commentsTotal: number
  /** How many days ahead booking is open (today included) */
  availabilityDays: number
  bookingState: 'booking' | 'request' | 'pending'
}

export type RelatedBarber = {
  id: string
  slug: string
  shopName: string
  rating: number
  reviewCount: number
  city: string
  avatar: BarberImage
  mainService: string
  bookingState: 'booking' | 'request' | 'pending'
}

/** How many services to show before the «مشاهده همه» reveal. */
export const PREVIEW_LIMITS = {
  services: 6,
} as const

export function formatPrice(price?: number | null): string | null {
  if (price == null || Number.isNaN(price)) return null
  return `${price.toLocaleString('fa-IR')} تومان`
}

export function formatDuration(minutes?: number): string | null {
  if (minutes == null) return null
  return `${minutes.toLocaleString('fa-IR')} دقیقه`
}
