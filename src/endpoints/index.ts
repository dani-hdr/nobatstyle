import type { Endpoint as PayloadEndpoint, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import { getBarberIdForUser } from '../lib/barber-user'
import { getBarberSubscriptionState } from '../lib/subscriptions.server'
import { ROLES } from '../utils/constants'
import { STATUS_META } from '../utils/constants'

/**
 * Public-safe subset of platform settings for the frontend. Never exposes
 * private/admin-only fields.
 */
export const settingsPublicEndpoint: PayloadEndpoint = {
  path: '/settings/public',
  method: 'get',
  handler: async (req) => {
    const settings = await req.payload.findGlobal({
      slug: 'settings',
      depth: 0,
      overrideAccess: true,
    })
    const home = await req.payload.findGlobal({
      slug: 'home',
      depth: 0,
      overrideAccess: true,
    })
    return Response.json({
      general: {
        ...settings.general,
        logo: settings.general?.logo ?? null,
      },
      navigation: settings.navigation ?? { links: [] },
      auth: {
        registrationEnabled: settings.auth?.registrationEnabled ?? true,
        otpEnabled: settings.auth?.otpEnabled ?? false,
      },
      hero: home.hero,
    })
  },
}

export const statusMetaEndpoint: PayloadEndpoint = {
  path: '/status-meta',
  method: 'get',
  handler: () => Response.json(STATUS_META),
}

function dashboardAuth(req: any, allowed: string[]) {
  if (!req.user) throw new APIError('Unauthorized', 401)
  if (!allowed.includes(req.user.role)) throw new APIError('Forbidden', 403)
}

/** Reads `page`/`limit` from the query string with sane bounds. */
function paginationParams(req: PayloadRequest, defaultLimit = 6): { page: number; limit: number } {
  const url = new URL(req.url || '')
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || defaultLimit))
  return { page, limit }
}

function readTab(req: PayloadRequest, fallback: string, allowed: readonly string[]): string {
  const url = new URL(req.url || '')
  const tab = url.searchParams.get('tab') || fallback
  return allowed.includes(tab) ? tab : fallback
}

/**
 * GET /api/customer/dashboard?tab=upcoming|past|cancelled|barbers&page=&limit=
 * Aggregated, ready-to-render data for the customer dashboard. The requested
 * tab's list is paginated server-side; counts for every tab are included so
 * the UI can render badges without extra round-trips.
 */
export const customerDashboardEndpoint: PayloadEndpoint = {
  path: '/customer/dashboard',
  method: 'get',
  handler: async (req) => {
    dashboardAuth(req, [ROLES.CUSTOMER])
    const me = String(req.user!.id)
    const CUSTOMER_TABS = ['upcoming', 'past', 'cancelled', 'barbers'] as const
    const tab = readTab(req, 'upcoming', CUSTOMER_TABS)
    const { page, limit } = paginationParams(req)

    const now = new Date().toISOString()
    const isAppointmentTab = tab === 'upcoming' || tab === 'past' || tab === 'cancelled'

    const appointmentWhere = (kind: 'upcoming' | 'past' | 'cancelled'): Where => {
      if (kind === 'cancelled') {
        return { and: [{ customer: { equals: me } }, { status: { equals: 'cancelled' } }] }
      }
      return {
        and: [
          { customer: { equals: me } },
          { status: { equals: 'reserved' } },
          { toDate: kind === 'upcoming' ? { greater_than_equal: now } : { less_than: now } },
        ],
      }
    }

    // The selected tab's page + the next-upcoming appointment for the header.
    const [appointmentsRes, nextRes, barbersRes] = await Promise.all([
      isAppointmentTab
        ? req.payload.find({
            collection: 'appointments',
            depth: 1,
            where: appointmentWhere(tab as 'upcoming' | 'past' | 'cancelled'),
            sort: tab === 'past' || tab === 'cancelled' ? '-fromDate' : 'fromDate',
            limit,
            page,
            overrideAccess: false,
            req,
          })
        : Promise.resolve(null),
      req.payload.find({
        collection: 'appointments',
        depth: 1,
        where: appointmentWhere('upcoming'),
        sort: 'fromDate',
        limit: 1,
        pagination: false,
        overrideAccess: false,
        req,
      }),
      tab === 'barbers'
        ? req.payload.find({
            collection: 'barbers',
            depth: 1,
            where: { customers: { contains: me } },
            sort: '-createdAt',
            limit,
            page,
            overrideAccess: false,
            req,
          })
        : Promise.resolve(null),
    ])

    const [upcomingCount, pastCount, cancelledCount, barbersCount] =
      await Promise.all([
        req.payload.count({
          collection: 'appointments',
          where: appointmentWhere('upcoming'),
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'appointments',
          where: appointmentWhere('past'),
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'appointments',
          where: appointmentWhere('cancelled'),
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'barbers',
          where: { customers: { contains: me } },
          overrideAccess: false,
          req,
        }),
      ])

    const activeTotalDocs = isAppointmentTab
      ? appointmentsRes?.totalDocs ?? 0
      : barbersRes?.totalDocs ?? 0

    const myBarbers =
      tab === 'barbers'
        ? await resolveCustomerBarbers(req, barbersRes!.docs)
        : []

    return Response.json({
      tab,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(activeTotalDocs / limit)),
      totalDocs: activeTotalDocs,
      counts: {
        upcoming: upcomingCount.totalDocs,
        past: pastCount.totalDocs,
        cancelled: cancelledCount.totalDocs,
        barbers: barbersCount.totalDocs,
      },
      nextAppointment: nextRes.docs[0] ?? null,
      appointments: isAppointmentTab ? (appointmentsRes?.docs ?? []) : [],
      barbers: myBarbers,
    })
  },
}

/**
 * GET /api/barber/dashboard?tab=all|requests|customers|comments&page=&limit=&upcomingPage=&upcomingLimit=
 * Aggregated, ready-to-render data (incl. stats) for the barber dashboard.
 * «Upcoming» appointments and the add-slot form live on the page outside the
 * tabs, so upcoming is always returned (paginated). Each tab's list is
 * paginated server-side too.
 */
export const barberDashboardEndpoint: PayloadEndpoint = {
  path: '/barber/dashboard',
  method: 'get',
  handler: async (req) => {
    dashboardAuth(req, [ROLES.BARBER])
    const userId = String(req.user!.id)
    const barberId = await getBarberIdForUser(req.payload, userId)
    if (!barberId) throw new APIError('Barber profile not found', 404)

    const BARBER_TABS = ['all', 'requests', 'customers', 'comments'] as const
    const tab = readTab(req, 'all', BARBER_TABS)
    const { page, limit } = paginationParams(req)
    const upcomingPage = Math.max(
      1,
      Number(new URL(req.url || '').searchParams.get('upcomingPage')) || 1,
    )
    const upcomingLimit = Math.min(
      12,
      Math.max(1, Number(new URL(req.url || '').searchParams.get('upcomingLimit')) || 6),
    )

    const now = new Date().toISOString()
    const subscriptionState = await getBarberSubscriptionState(req.payload, barberId)

    // Fetch the barber first — service ids & customer ids come from it.
    const barber = await req.payload.findByID({
      collection: 'barbers',
      id: barberId,
      depth: 1,
      overrideAccess: false,
      req,
    })

    const serviceIds = (barber?.services ?? []).map((s) =>
      String(typeof s === 'object' && s !== null ? s.id : s),
    )
    const customerIds = (barber?.customers ?? []).map((c) =>
      String(typeof c === 'object' && c !== null ? c.id : c),
    )

    const [upcomingRes, allRes, requestsRes, commentsRes, servicesRes] =
      await Promise.all([
        // Upcoming appointments — always shown on the page (paginated).
        req.payload.find({
          collection: 'appointments',
          depth: 1,
          where: {
            and: [
              { barber: { equals: barberId } },
              { status: { equals: 'reserved' } },
              { toDate: { greater_than_equal: now } },
            ],
          },
          sort: 'fromDate',
          limit: upcomingLimit,
          page: upcomingPage,
          overrideAccess: false,
          req,
        }),
        // 'all' tab: full history (paginated).
        tab === 'all'
          ? req.payload.find({
              collection: 'appointments',
              depth: 1,
              where: { barber: { equals: barberId } },
              sort: '-fromDate',
              limit,
              page,
              overrideAccess: false,
              req,
            })
          : Promise.resolve(null),
        tab === 'requests'
          ? req.payload.find({
              collection: 'barber-requests',
              depth: 1,
              where: { and: [{ barber: { equals: barberId } }, { status: { equals: 'pending' } }] },
              sort: '-createdAt',
              limit,
              page,
              overrideAccess: false,
              req,
            })
          : Promise.resolve(null),
        tab === 'comments'
          ? req.payload.find({
              collection: 'comments',
              depth: 1,
              where: { barber: { equals: barberId }, status: { equals: 'active' } },
              sort: '-createdAt',
              limit,
              page,
              overrideAccess: false,
              req,
            })
          : Promise.resolve(null),
        serviceIds.length > 0
          ? req.payload.find({
              collection: 'services',
              depth: 0,
              where: {
                and: [{ id: { in: serviceIds } }, { isActive: { equals: true } }],
              },
              sort: 'name',
              limit: 100,
              pagination: false,
              overrideAccess: false,
              req,
            })
          : Promise.resolve({ docs: [] as { id: string; name?: string }[] }),
      ])

    // Customer names/docs are resolved explicitly (users are self-read).
    const customers = tab === 'customers' ? await resolveBarberCustomers(req, barberId, page, limit) : []

    // Relationship population respects access control, and barbers cannot read
    // other users — resolve customer name/phone explicitly for appointment lists.
    const [upcoming, appointments] = await Promise.all([
      resolveAppointmentCustomers(req, upcomingRes.docs),
      tab === 'all' ? resolveAppointmentCustomers(req, allRes?.docs ?? []) : Promise.resolve([]),
    ])

    const customerRequests =
      tab === 'requests'
        ? await Promise.all(
            requestsRes!.docs.map(async (r) => {
              const customerId =
                typeof r.customer === 'object' ? String(r.customer.id) : String(r.customer)
              const user = await req.payload
                .findByID({
                  collection: 'users',
                  id: customerId,
                  depth: 0,
                  overrideAccess: true,
                  req,
                })
                .catch(() => null)
              return {
                id: String(r.id),
                createdAt: r.createdAt,
                customer: {
                  id: customerId,
                  name: user?.name ?? null,
                  username: user?.username ?? null,
                },
              }
            }),
          )
        : []

    const [upcomingCount, allCount, requestsCount, customersCount, commentsCount, completedCount] =
      await Promise.all([
        req.payload.count({
          collection: 'appointments',
          where: {
            and: [
              { barber: { equals: barberId } },
              { status: { equals: 'reserved' } },
              { toDate: { greater_than_equal: now } },
            ],
          },
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'appointments',
          where: { barber: { equals: barberId } },
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'barber-requests',
          where: { and: [{ barber: { equals: barberId } }, { status: { equals: 'pending' } }] },
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'users',
          where: customerIds.length > 0 ? { id: { in: customerIds } } : { id: { equals: '' } },
          overrideAccess: true,
          req,
        }),
        req.payload.count({
          collection: 'comments',
          where: { barber: { equals: barberId }, status: { equals: 'active' } },
          overrideAccess: false,
          req,
        }),
        req.payload.count({
          collection: 'appointments',
          where: {
            and: [
              { barber: { equals: barberId } },
              { status: { equals: 'reserved' } },
              { toDate: { less_than: now } },
            ],
          },
          overrideAccess: false,
          req,
        }),
      ])

    const activeTotalDocs =
      tab === 'requests'
        ? requestsRes?.totalDocs ?? 0
        : tab === 'customers'
          ? customersCount.totalDocs
          : tab === 'comments'
            ? commentsRes?.totalDocs ?? 0
            : allRes?.totalDocs ?? 0

    return Response.json({
      tab,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(activeTotalDocs / limit)),
      totalDocs: activeTotalDocs,
      counts: {
        upcoming: upcomingCount.totalDocs,
        all: allCount.totalDocs,
        requests: requestsCount.totalDocs,
        customers: customersCount.totalDocs,
        comments: commentsCount.totalDocs,
      },
      upcoming,
      upcomingPage,
      upcomingLimit,
      upcomingTotalPages: Math.max(1, Math.ceil(upcomingRes.totalDocs / upcomingLimit)),
      upcomingTotalDocs: upcomingRes.totalDocs,
      barber,
      services: servicesRes.docs.map((s) => ({ id: String(s.id), name: s.name ?? '' })),
      appointments,
      customerRequests,
      customers,
      comments: tab === 'comments' ? (commentsRes?.docs ?? []) : [],
      subscription: subscriptionState,
      statistics: {
        completedCount: completedCount.totalDocs,
        rating: barber?.rating ?? 0,
        reviewCount: barber?.reviewCount ?? 0,
      },
    })
  },
}

/** Resolves barber avatar/city for a customer's "my barbers" list. */
async function resolveCustomerBarbers(
  req: PayloadRequest,
  barbers: { id: string; shopName: string; rating?: number | null; reviewCount?: number | null; city?: unknown; user?: unknown }[],
): Promise<unknown[]> {
  return Promise.all(
    barbers.map(async (b) => {
      const ownerId =
        typeof b.user === 'object' && b.user !== null
          ? String((b.user as { id: string }).id)
          : null
      const owner = ownerId
        ? await req.payload
            .findByID({
              collection: 'users',
              id: ownerId,
              depth: 0,
              overrideAccess: true,
              req,
            })
            .catch(() => null)
        : null
      const avatar =
        owner?.avatar && typeof owner.avatar === 'object' && (owner.avatar as { url?: string }).url
          ? (owner.avatar as { url: string }).url
          : null
      return {
        id: String(b.id),
        shopName: b.shopName,
        rating: b.rating ?? 0,
        reviewCount: b.reviewCount ?? 0,
        city: b.city,
        avatar: avatar ? { url: avatar } : null,
      }
    }),
  )
}

/** Resolves a barber's approved customers (paginated) with display names. */
async function resolveBarberCustomers(
  req: PayloadRequest,
  barberId: string,
  page: number,
  limit: number,
): Promise<unknown[]> {
  const barber = await req.payload.findByID({
    collection: 'barbers',
    id: barberId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const ids = (barber?.customers ?? []).map((c) => String(typeof c === 'object' ? c.id : c))
  const start = (page - 1) * limit
  const slice = ids.slice(start, start + limit)
  const users = await Promise.all(
    slice.map(async (customerId) => {
      const user = await req.payload
        .findByID({
          collection: 'users',
          id: customerId,
          depth: 0,
          overrideAccess: true,
          req,
        })
        .catch(() => null)
      if (!user) return null
      return {
        id: customerId,
        name: user.name ?? null,
        username: user.username ?? null,
        avatar: user.avatar ?? null,
      }
    }),
  )
  return users.filter((c): c is NonNullable<typeof c> => c !== null)
}

/**
 * Replaces each appointment's raw customer id with a display object. Payload's
 * relationship population honors collection access, and barbers may not read
 * other users, so customer relationships arrive as bare ids. Resolve the
 * name/phone explicitly with elevated access (mirrors the requests tab).
 */
async function resolveAppointmentCustomers(
  req: PayloadRequest,
  docs: { customer?: unknown }[],
): Promise<unknown[]> {
  if (docs.length === 0) return docs

  const ids = Array.from(
    new Set(
      docs
        .map((d) => d.customer)
        .filter((c) => c !== null && c !== undefined)
        .map((c) => String(typeof c === 'object' ? (c as { id: string }).id : c)),
    ),
  )
  if (ids.length === 0) return docs

  const result = await req.payload.find({
    collection: 'users',
    where: { id: { in: ids } },
    depth: 0,
    limit: ids.length,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const byId = new Map(result.docs.map((u) => [String(u.id), u]))

  return docs.map((doc) => {
    const cid =
      doc.customer === null || doc.customer === undefined
        ? null
        : String(
            typeof doc.customer === 'object'
              ? (doc.customer as { id: string }).id
              : doc.customer,
          )
    const user = cid ? byId.get(cid) : undefined
    return {
      ...doc,
      customer: user
        ? { id: String(user.id), name: user.name ?? null, username: user.username ?? null }
        : doc.customer,
    }
  })
}
