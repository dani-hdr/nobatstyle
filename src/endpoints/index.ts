import type { Endpoint as PayloadEndpoint } from 'payload'
import { APIError } from 'payload'
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
      booking: {
        slotStepMinutes: settings.booking?.slotStepMinutes ?? 15,
        cancellationWindowMinutes: settings.booking?.cancellationWindowMinutes ?? 120,
        maxBookingHorizonDays: settings.booking?.maxBookingHorizonDays ?? 45,
        defaultStatus: settings.booking?.defaultStatus ?? 'pending',
      },
      auth: {
        registrationEnabled: settings.auth?.registrationEnabled ?? true,
        otpEnabled: settings.auth?.otpEnabled ?? false,
      },
      hero: home.hero,
      promo: home.promo,
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

/**
 * GET /api/customer/dashboard
 * Aggregated, ready-to-render data for the customer dashboard.
 */
export const customerDashboardEndpoint: PayloadEndpoint = {
  path: '/customer/dashboard',
  method: 'get',
  handler: async (req) => {
    dashboardAuth(req, [ROLES.CUSTOMER])
    const me = req.user!.id

    const byStatus = async (status?: string, limit = 20) => {
      const where: Record<string, any> = { customer: { equals: me } }
      if (status) where.status = { equals: status }
      const res = await req.payload.find({
        collection: 'appointments',
        depth: 1,
        where,
        sort: status === 'upcoming' ? 'date' : '-date',
        limit,
        overrideAccess: false,
      })
      return res.docs
    }

    const [upcoming, past, cancelled, notifications] = await Promise.all([
      req.payload.find({
        collection: 'appointments',
        depth: 1,
        where: { and: [{ customer: { equals: me } }, { status: { not_equals: 'cancelled' } }] },
        sort: 'date',
        limit: 10,
        overrideAccess: false,
      }),
      byStatus(),
      byStatus('cancelled'),
      req.payload.find({
        collection: 'notifications',
        depth: 0,
        where: { user: { equals: me } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
      }),
    ])

    return Response.json({
      nextAppointment: upcoming.docs[0] ?? null,
      appointments: upcoming.docs,
      pastAppointments: past,
      cancelledAppointments: cancelled,
      notifications: notifications.docs,
    })
  },
}

/**
 * GET /api/barber/dashboard
 * Aggregated, ready-to-render data (incl. stats) for the barber dashboard.
 */
export const barberDashboardEndpoint: PayloadEndpoint = {
  path: '/barber/dashboard',
  method: 'get',
  handler: async (req) => {
    dashboardAuth(req, [ROLES.BARBER])
    const userId = req.user!.id
    const barberId = String(req.user!.activeBarber)
    if (!barberId) throw new APIError('Barber profile not found', 404)

    const apptWhere = { barber: { equals: barberId } }
    const [newRequests, upcoming, completed, reviews, notifications, barber] = await Promise.all([
      req.payload.find({
        collection: 'appointments',
        depth: 1,
        where: { ...apptWhere, status: { equals: 'pending' } },
        sort: 'date',
        limit: 20,
        overrideAccess: false,
      }),
      req.payload.find({
        collection: 'appointments',
        depth: 1,
        where: { and: [{ barber: { equals: barberId } }, { status: { not_equals: 'cancelled' } }] },
        sort: 'date',
        limit: 50,
        overrideAccess: false,
      }),
      req.payload.count({
        collection: 'appointments',
        where: { ...apptWhere, status: { equals: 'completed' } },
        overrideAccess: false,
      }),
      req.payload.find({
        collection: 'reviews',
        depth: 1,
        where: { barber: { equals: barberId }, status: { equals: 'active' } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
      }),
      req.payload.find({
        collection: 'notifications',
        depth: 0,
        where: { user: { equals: userId } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
      }),
      req.payload.findByID({ collection: 'barbers', id: barberId, depth: 1, overrideAccess: false }),
    ])

    return Response.json({
      barber,
      newRequests: newRequests.docs,
      appointments: upcoming.docs,
      reviews: reviews.docs,
      notifications: notifications.docs,
      statistics: {
        completedCount: completed.totalDocs,
        rating: barber?.rating ?? 0,
        reviewCount: barber?.reviewCount ?? 0,
      },
    })
  },
}
