import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'
import { isSlotAvailable, toHHMM, toMinutes } from '../utils/availability'

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  admin: {
    useAsTitle: 'id',
    group: 'رزرو',
    defaultColumns: ['barber', 'customer', 'date', 'startTime', 'serviceName', 'status'],
  },
  access: {
    read: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      const where: Where = u.role === ROLES.BARBER ? { barber: { equals: String(u.activeBarber) } } : { customer: { equals: u.id } }
      return where
    },
    create: ({ req }) => {
      // Any logged-in user (customer, and barbers booking elsewhere) may book.
      return Boolean(req.user)
    },
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      const where: Where = u.role === ROLES.BARBER ? { barber: { equals: String(u.activeBarber) } } : { customer: { equals: u.id } }
      return where
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      const where: Where = u.role === ROLES.BARBER ? { barber: { equals: String(u.activeBarber) } } : { customer: { equals: u.id } }
      return where
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Cancelling frees the slot automatically via availability re-validation.
        if (data.status === 'cancelled') return data

        let duration = data.duration as number | undefined
        let price = data.price as number | undefined
        let serviceName = data.serviceName as string | undefined

        if (data.service && !duration) {
          const svc = await req.payload.findByID({
            collection: 'services',
            id: data.service as string,
            depth: 0,
          })
          if (svc) {
            duration = svc.duration
            price = svc.price
            serviceName = svc.name
          }
        }

        const startMins = toMinutes(data.startTime as string)
        data.duration = duration || 0
        data.price = price || 0
        data.serviceName = serviceName || ''
        data.endTime = toHHMM(startMins + data.duration)

        // Re-validate availability at submit time so concurrent bookings can't overlap.
        if (operation === 'create' && data.barber && data.date && data.startTime) {
          const bookingDate = new Date(`${String(data.date).slice(0, 10)}T00:00:00`)
          const ok = await isSlotAvailable(req, data.barber as string, bookingDate, data.startTime as string, data.duration)
          if (!ok) {
            throw new APIError('این بازه زمانی دیگر در دسترس نیست', 409)
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
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'serviceName',
      type: 'text',
      admin: { readOnly: true, description: 'عکس فوری از نام خدمت در زمان رزرو' },
    },
    {
      name: 'price',
      type: 'number',
      admin: { readOnly: true, description: 'عکس فوری از قیمت در زمان رزرو' },
    },
    {
      name: 'duration',
      type: 'number',
      admin: { readOnly: true, description: 'مدت به دقیقه' },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'startTime',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'ساعت شروع، e.g. 18:30',
      },
    },
    {
      name: 'endTime',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      admin: {
        position: 'sidebar',
      },
      options: [
        { label: 'در انتظار تأیید', value: 'pending' },
        { label: 'تأیید شده', value: 'confirmed' },
        { label: 'انجام شده', value: 'completed' },
        { label: 'لغو شده', value: 'cancelled' },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'یادداشت',
    },
    {
      name: 'cancelReason',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
  ],
}
