import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import { isAdmin } from '../access'
import { getBarberIdForUser } from '../lib/barber-user'
import { canAcceptBookings } from '../lib/subscriptions.server'
import { ROLES } from '../utils/constants'

/** Row constraint limiting a barber to their own shop's appointments. */
async function ownBarberWhere(
  payload: PayloadRequest['payload'],
  userId: string,
): Promise<Where | false> {
  const barberId = await getBarberIdForUser(payload, userId)
  if (!barberId) return false
  return { barber: { equals: barberId } }
}

/**
 * Appointment windows a barber offers. Each window references a catalog
 * service and a from/to datetime range. Customers reserve an available window
 * (status === 'available') via the `reserve` endpoint.
 */
export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: {
    singular: 'نوبت',
    plural: 'نوبت ها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['barber', 'service', 'fromDate', 'toDate', 'status', 'customer'],
  },
  access: {
    // Public reads available windows; barbers/admins read everything;
    // customers additionally see their own reservations.
    read: ({ req }) => {
      if (!req.user) return { status: { equals: 'available' } }
      if (isAdmin({ req })) return true
      if (req.user.role === ROLES.BARBER) return ownBarberWhere(req.payload, req.user.id)
      const where: Where = {
        or: [
          { status: { equals: 'available' } },
          { customer: { equals: String(req.user.id) } },
        ],
      }
      return where
    },
    create: ({ req }) => {
      if (!req.user) return false
      return isAdmin({ req }) || req.user.role === ROLES.BARBER
    },
    update: async ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) return ownBarberWhere(req.payload, u.id)
      return false
    },
    delete: async ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) return ownBarberWhere(req.payload, u.id)
      return false
    },
  },
  endpoints: [
    {
      // POST /api/appointments/:id/reserve — reserve an available window.
      path: '/:id/reserve',
      method: 'post',
      handler: async (req) => {
        if (!req.user) throw new APIError('Unauthorized', 401)
        const id = String(req.routeParams?.['id'])

        const existing = await req.payload.findByID({
          collection: 'appointments',
          id,
          depth: 0,
          overrideAccess: false,
        })
        if (!existing) throw new APIError('Appointment not found', 404)
        if (existing.status !== 'available') {
          throw new APIError('این وقت دیگر در دسترس نیست', 409)
        }

        // Subscription gate — customers book free, but the shop must be
        // covered (trial or paid plan) to accept reservations.
        const barberId = String(
          typeof existing.barber === 'object' && existing.barber
            ? existing.barber.id
            : existing.barber,
        )
        if (!(await canAcceptBookings(req.payload, barberId))) {
          throw new APIError('ظرفیت رزرو این آرایشگاه موقتاً غیرفعال است.', 403)
        }

        // Customer-membership gate — a customer may only book once the
        // barber has approved their request (or booked before the rule).
        if (req.user.role === ROLES.CUSTOMER) {
          const requesterId = String(req.user.id)

          // Customers must have a name so barbers know who is booking.
          const customerUser = await req.payload
            .findByID({
              collection: 'users',
              id: requesterId,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => null)
          if (!customerUser?.name?.trim()) {
            throw new APIError('برای رزرو ابتدا نام خود را در پروفایل تکمیل کنید', 403)
          }

          const barberDoc = await req.payload.findByID({
            collection: 'barbers',
            id: barberId,
            depth: 0,
            overrideAccess: true,
          })
          const memberIds = (barberDoc.customers ?? []).map((c) =>
            String(typeof c === 'object' ? c.id : c),
          )
          let isMember = memberIds.includes(requesterId)
          if (!isMember) {
            const approvedRes = await req.payload.find({
              collection: 'barber-requests',
              where: {
                and: [
                  { barber: { equals: barberId } },
                  { customer: { equals: requesterId } },
                  { status: { equals: 'approved' } },
                ],
              },
              limit: 1,
              pagination: false,
              overrideAccess: true,
            })
            isMember = approvedRes.docs.length > 0
          }
          if (!isMember) {
            throw new APIError('برای رزرو ابتدا باید درخواست شما توسط آرایشگر تایید شود', 403)
          }
        }

        let customerMessage = ''
        try {
          const body = (await req.json?.()) ?? {}
          customerMessage =
            body?.message && typeof body.message === 'string' ? body.message.slice(0, 1000) : ''
        } catch {
          // Optional field — ignore malformed/empty bodies.
        }

        const updated = await req.payload.update({
          collection: 'appointments',
          id,
          data: {
            customer: req.user.id,
            status: 'reserved',
            customerMessage,
          },
          // The handler above already validated identity and availability;
          // regular update access intentionally excludes customers.
          overrideAccess: true,
          req,
        })

        return Response.json(updated)
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.role === ROLES.BARBER && !data.barber) {
          const barberId = await getBarberIdForUser(req.payload, req.user.id)
          if (!barberId) throw new APIError('پروفایل آرایشگر یافت نشد', 404)
          data.barber = barberId
        }
        // Barbers without subscription coverage cannot stock new slots.
        if (operation === 'create' && req.user?.role === ROLES.BARBER && data.barber) {
          const barberId = String(
            typeof data.barber === 'object' && data.barber ? data.barber.id : data.barber,
          )
          const ownBarberId = await getBarberIdForUser(req.payload, req.user.id)
          if (ownBarberId === barberId && !(await canAcceptBookings(req.payload, barberId))) {
            throw new APIError('برای ثبت وقت جدید ابتدا اشتراک خود را فعال کنید.', 403)
          }
        }
        if (data.status && data.status !== 'available' && !data.customer) {
          throw new APIError('برای رزرو این وقت باید مشتری مشخص شود', 400)
        }
        if (data.fromDate && data.toDate) {
          const from = new Date(data.fromDate).getTime()
          const to = new Date(data.toDate).getTime()
          if (to <= from) {
            throw new APIError('«تا» باید بعد از «از» باشد', 400)
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Track the barber's customers (many-to-many with users) so the
        // profile page can show the «آرایشگر شما» badge.
        if (!doc?.customer || !doc?.barber) return
        const barberId = typeof doc.barber === 'object' ? doc.barber.id : doc.barber
        const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
        const barberDoc = await req.payload.findByID({
          collection: 'barbers',
          id: String(barberId),
          depth: 0,
          overrideAccess: true,
        })
        const existing = (barberDoc.customers ?? []).map((c) => String(typeof c === 'object' ? c.id : c))
        if (existing.includes(String(customerId))) return
        await req.payload.update({
          collection: 'barbers',
          id: String(barberId),
          data: { customers: [...existing, String(customerId)] },
          req,
          overrideAccess: true,
        })
      },
    ],
  },
  fields: [
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
      required: true,
      index: true,
      label: 'آرایشگر',
      admin: {
        condition: (data, siblingData, { user }) => user?.role !== ROLES.BARBER,
      },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      index: true,
      label: 'خدمت',
      filterOptions: async ({ data, req }) => {
        const active: Where = { isActive: { equals: true } }
        const barberId = data?.barber
        if (!barberId) return active
        const barber = await req.payload.findByID({
          collection: 'barbers',
          id: String(barberId),
          depth: 0,
          overrideAccess: false,
        })
        const offered = (barber?.services ?? []).map((s) => String(s))
        if (offered.length === 0) return false
        return { and: [active, { id: { in: offered } }] }
      },
      admin: {
        condition: (data) => Boolean(data?.barber),
      },
    },
    {
      name: 'fromDate',
      type: 'date',
      required: true,
      index: true,
      label: 'از (تاریخ و ساعت)',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
    {
      name: 'toDate',
      type: 'date',
      required: true,
      index: true,
      label: 'تا (تاریخ و ساعت)',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: 'مشتری (رزرو شده)',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerMessage',
      type: 'textarea',
      label: 'پیام مشتری',
      admin: {
        description: 'پیامی که مشتری هنگام رزرو نوشته است (اختیاری).',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'available',
      index: true,
      label: 'وضعیت',
      admin: {
        position: 'sidebar',
      },
      options: [
        { label: 'آزاد', value: 'available' },
        { label: 'رزرو شده', value: 'reserved' },
        { label: 'لغو شده', value: 'cancelled' },
      ],
    },
  ],
}
