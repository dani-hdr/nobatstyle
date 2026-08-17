import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'
import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

/**
 * Appointment windows a barber offers. Each window references a catalog
 * service and a from/to datetime range. Customers reserve an available window
 * (status === 'available') via the `reserve` endpoint.
 */
export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: {
    singular: 'رزرو',
    plural: 'رزروها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['barber', 'service', 'fromDate', 'toDate', 'status', 'customer'],
  },
  access: {
    // Public reads available windows; barbers/admins read everything.
    read: ({ req }) => {
      if (!req.user) return { status: { equals: 'available' } }
      if (isAdmin({ req })) return true
      if (req.user.role === ROLES.BARBER) {
        const where: Where = { barber: { equals: String(req.user.activeBarber) } }
        return where
      }
      const where: Where = { status: { equals: 'available' } }
      return where
    },
    create: ({ req }) => {
      if (!req.user) return false
      return isAdmin({ req }) || req.user.role === ROLES.BARBER
    },
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        return { barber: { equals: String(u.activeBarber) } }
      }
      return false
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        return { barber: { equals: String(u.activeBarber) } }
      }
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

        const updated = await req.payload.update({
          collection: 'appointments',
          id,
          data: {
            customer: req.user.id,
            status: 'reserved',
          },
          overrideAccess: false,
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
          data.barber = String(req.user.activeBarber)
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
