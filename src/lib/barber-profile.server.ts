/**
 * Server-only Payload queries for the Barber single page. Maps DB documents
 * onto the UI-facing types in `barber-profile.ts` (which stays client-safe).
 */

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import type {
  Barber as BarberDoc,
  City,
  Comment as CommentDoc,
  Media,
  Service as ServiceDoc,
} from '@/payload-types'

import { getBarberSubscriptionState, getExpiredBarberIds } from './subscriptions.server'
import type {
  BarberImage,
  BarberProfile,
  RelatedBarber,
} from './barber-profile'

/** Fallback so the hero never renders broken without uploads. */
const FALLBACK_COVER: BarberImage = { url: '/barber/nobat-cover.svg', alt: '' }
const BOOKING_WINDOW_DAYS = 2 // today + tomorrow
const COMMENT_STATUSES = ['active'] as const
/** Comments rendered server-side; the rest loads via /api/comments pagination. */
export const COMMENTS_PAGE_SIZE = 5

function toImg(
  m: Media | string | number | null | undefined,
  fallbackAlt: string,
): BarberImage | null {
  if (!m || typeof m !== 'object' || !m.url) return null
  return { url: m.url, alt: m.alt || fallbackAlt }
}

function faDigits(v: string | number): string {
  return String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

/** Resolves the signed-in visitor's id from the request cookies (if any). */
async function getCurrentUserId(payload: Payload): Promise<string | null> {
  try {
    const { user } = await payload.auth({ headers: await headers() })
    return user?.id != null ? String(user.id) : null
  } catch {
    // No request scope (e.g. prerender) — treat as anonymous.
    return null
  }
}

/**
 * Loads the full barber page payload for a slug: profile plus related barbers.
 * Returns null when no barber matches.
 */
export async function getBarberPageData(
  slug: string,
): Promise<{ profile: BarberProfile; related: RelatedBarber[] } | null> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'barbers',
    depth: 2,
    limit: 1,
    where: {
      and: [{ shopSlug: { equals: slug } }],
    },
  })
  const barber = docs[0]
  if (!barber) return null

  const barberId = String(barber.id)
  const cityObj = (typeof barber.city === 'object' ? barber.city : null) as City | null
  const serviceIds = (barber.services ?? []).map((s) => String(typeof s === 'object' ? s.id : s))

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  const [serviceRes, commentsRes, appointmentsToday, relatedRes] = await Promise.all([
    serviceIds.length > 0
      ? payload.find({
          collection: 'services',
          depth: 1,
          where: { and: [{ id: { in: serviceIds } }, { isActive: { equals: true } }] },
          sort: 'name',
          limit: 100,
        })
      : Promise.resolve({ docs: [] as ServiceDoc[] }),
    payload.find({
      collection: 'comments',
      depth: 1,
      where: {
        and: [
          { barber: { equals: barberId } },
          ...COMMENT_STATUSES.map((status) => ({ status: { equals: status } })),
        ],
      },
      sort: '-createdAt',
      limit: COMMENTS_PAGE_SIZE,
    }),
    payload.count({
      collection: 'appointments',
      where: {
        and: [
          { barber: { equals: barberId } },
          { status: { equals: 'available' } },
          {
            fromDate: {
              greater_than_equal: startOfToday.toISOString(),
              less_than: endOfToday.toISOString(),
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'barbers',
      depth: 2,
      where: {
        and: [
          { id: { not_equals: barberId } },
          ...(cityObj ? [{ city: { equals: String(cityObj.id) } }] : []),
        ],
      },
      sort: '-rating',
      limit: 4,
    }),
  ])

  const userObj =
    typeof barber.user === 'object' && barber.user !== null ? barber.user : null
  const cover = toImg(barber.cover, barber.shopName) ?? FALLBACK_COVER
  const avatar =
    toImg(userObj?.avatar, userObj?.name || barber.shopName) ?? undefined

  const currentUserId = await getCurrentUserId(payload)
  const customerIds = (barber.customers ?? []).map((c) =>
    String(typeof c === 'object' && c ? c.id : c),
  )
  const isYourBarber =
    currentUserId != null && customerIds.includes(String(currentUserId))

  // Owner of this shop viewing their own page — never gated by membership.
  const ownerId =
    typeof barber.user === 'object' && barber.user !== null ? String(barber.user.id) : null
  const viewerIsOwner = currentUserId != null && ownerId === String(currentUserId)

  /**
   * Booking CTA state:
   * - expired subscription keeps the old suspended behaviour;
   * - the owner always sees a normal booking button;
   * - an approved customer books freely (and sees «آرایشگر شما»);
   * - a pending requester sees a disabled «در انتظار تایید»;
   * - anyone else (incl. anonymous visitors) must send a request first.
   */
  let requestStatus: 'none' | 'pending' | 'approved' = 'none'
  if (currentUserId != null && !viewerIsOwner && !isYourBarber) {
    const res = await payload.find({
      collection: 'barber-requests',
      where: {
        and: [
          { barber: { equals: barberId } },
          { customer: { equals: String(currentUserId) } },
          { status: { in: ['pending', 'approved'] } },
        ],
      },
      limit: 1,
      pagination: false,
    })
    const doc = res.docs[0]
    if (doc?.status === 'pending') requestStatus = 'pending'
    else if (doc?.status === 'approved') requestStatus = 'approved'
  }

  const subscriptionState = await getBarberSubscriptionState(payload, barberId)
  const bookingSuspended = subscriptionState.mode === 'expired'

  let bookingState: BarberProfile['bookingState']
  let statusNote: string | undefined
  if (bookingSuspended) {
    bookingState = 'pending'
    statusNote = 'رزرو نوبت در این آرایشگاه موقتاً غیرفعال است'
  } else if (
    viewerIsOwner ||
    isYourBarber ||
    requestStatus === 'approved'
  ) {
    bookingState = 'booking'
  } else if (requestStatus === 'pending') {
    bookingState = 'pending'
    statusNote = 'درخواست شما در انتظار تایید آرایشگر است'
  } else {
    bookingState = 'request'
  }

  const satisfactionPct =
    (barber.reviewCount ?? 0) > 0 ? Math.round((barber.rating ?? 0) * 20) : null

  const profile: BarberProfile = {
    id: barberId,
    slug: barber.shopSlug || barberId,
    shopName: barber.shopName,
    barberName:
      typeof barber.user === 'object' && barber.user !== null
        ? barber.user.name ?? undefined
        : undefined,
    rating: barber.rating ?? 0,
    ratingMax: 5,
    reviewCount: barber.reviewCount ?? 0,
    city: cityObj?.name ?? '',
    address: barber.address ?? cityObj?.name ?? '',
    coordinates: barber.location
      ? { lat: barber.location[1], lng: barber.location[0] }
      : undefined,
    phone: barber.phone ?? undefined,
    avatar,
    coverImage: cover,
    gallery: (barber.gallery ?? [])
      .map((m) => toImg(m, barber.shopName))
      .filter((i): i is BarberImage => i !== null),
    isYourBarber,
    about: barber.about ?? undefined,
    stats: [
      {
        label: 'نوبت‌های مانده امروز',
        value: faDigits(appointmentsToday.totalDocs ?? 0),
        icon: 'slots',
      },
      {
        label: 'رضایت مشتری',
        value: satisfactionPct != null ? `${faDigits(satisfactionPct)}٪` : '—',
        icon: 'satisfaction',
      },
      { label: 'نظرات ثبت‌شده', value: faDigits(barber.reviewCount ?? 0), icon: 'reviews' },
      {
        label: 'سابقه فعالیت',
        value:
          barber.experienceYears != null && barber.experienceYears > 0
            ? `${faDigits(barber.experienceYears)} سال`
            : '—',
        icon: 'experience',
      },
    ],
    services: serviceRes.docs.map((s) => ({
      id: String(s.id),
      name: s.name,
      description: s.description ?? undefined,
      image: toImg(s.icon, s.name) ?? undefined,
    })),
    comments: commentsRes.docs.map((c: CommentDoc) => {
      const author = typeof c.author === 'object' ? c.author : null
      return {
        id: String(c.id),
        // Never fall back to username — it is the author's phone number.
        authorName: author?.name?.trim() || 'کاربر',
        rating: c.rating ?? undefined,
        text: c.content,
        date: c.createdAt,
      }
    }),
    commentsTotal: commentsRes.totalDocs,
    availabilityDays: BOOKING_WINDOW_DAYS,
    bookingState,
    statusNote,
  }

  const expiredRelated = await getExpiredBarberIds(
    payload,
    relatedRes.docs.map((b) => ({ id: String(b.id), createdAt: b.createdAt })),
  )

  const related: RelatedBarber[] = relatedRes.docs.map((b) => {
    const relUser = typeof b.user === 'object' && b.user !== null ? b.user : null
    const relAvatar =
      toImg(relUser?.avatar, b.shopName) ?? { url: FALLBACK_COVER.url, alt: b.shopName }
    const firstService = (b.services ?? []).find(
      (s): s is ServiceDoc => typeof s === 'object',
    )
    const relCity = typeof b.city === 'object' ? b.city : null
    return {
      id: String(b.id),
      slug: b.shopSlug || String(b.id),
      shopName: b.shopName,
      rating: b.rating ?? 0,
      reviewCount: b.reviewCount ?? 0,
      city: relCity?.name ?? '',
      avatar: relAvatar,
      mainService: firstService?.name ?? '',
      bookingState: expiredRelated.has(String(b.id)) ? 'pending' : 'booking',
    }
  })

  return { profile, related }
}
