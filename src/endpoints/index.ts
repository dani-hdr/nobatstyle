import type { Endpoint as PayloadEndpoint, Where } from 'payload'
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

    const findMy = async (status?: string) => {
      const where: Where = { customer: { equals: me } }
      if (status) where.status = { equals: status }
      const res = await req.payload.find({
        collection: 'appointments',
        depth: 1,
        where,
        sort: status === 'cancelled' ? '-fromDate' : 'fromDate',
        limit: 50,
        overrideAccess: false,
        req,
      })
      return res.docs
    }

    const [appointments, past, cancelled, notifications] = await Promise.all([
      findMy(),
      findMy(),
      findMy('cancelled'),
      // `req` threads the authenticated user through to access control.
      req.payload.find({
        collection: 'notifications',
        depth: 0,
        where: { user: { equals: me } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
        req,
      }),
    ])

    return Response.json({
      nextAppointment: appointments.filter((a) => a.status === 'reserved')[0] ?? null,
      appointments,
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
    const barberId = await getBarberIdForUser(req.payload, userId)
    if (!barberId) throw new APIError('Barber profile not found', 404)

    const subscriptionState = await getBarberSubscriptionState(req.payload, barberId)

    const [barber, appointmentsRes, comments, notifications] = await Promise.all([
      req.payload.findByID({
        collection: 'barbers',
        id: barberId,
        depth: 1,
        overrideAccess: false,
        req,
      }),
      req.payload.find({
        collection: 'appointments',
        depth: 1,
        where: { barber: { equals: barberId } },
        sort: 'fromDate',
        limit: 200,
        overrideAccess: false,
        req,
      }),
      req.payload.find({
        collection: 'comments',
        depth: 1,
        where: { barber: { equals: barberId }, status: { equals: 'active' } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
        req,
      }),
      req.payload.find({
        collection: 'notifications',
        depth: 0,
        where: { user: { equals: userId } },
        sort: '-createdAt',
        limit: 20,
        overrideAccess: false,
        req,
      }),
    ])

    const allAppointments = appointmentsRes.docs

    return Response.json({
      barber,
      appointments: allAppointments,
      newRequests: allAppointments.filter((a) => a.status === 'reserved'),
      comments: comments.docs,
      notifications: notifications.docs,
      subscription: subscriptionState,
      statistics: {
        completedCount: allAppointments.filter(
          (a) => a.status === 'reserved' && a.toDate && new Date(a.toDate).getTime() < Date.now(),
        ).length,
        rating: barber?.rating ?? 0,
        reviewCount: barber?.reviewCount ?? 0,
      },
    })
  },
}
