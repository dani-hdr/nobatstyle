import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

/**
 * Specific dates (or parts of a date) where a barber is unavailable, overriding
 * the recurring workingHours. The availability engine reads this to produce the
 * public calendar.
 */
export const AvailabilityExceptions: CollectionConfig = {
  slug: 'availabilityExceptions',
  admin: {
    useAsTitle: 'label',
    group: 'آرایشگاه‌ها',
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      return isAdmin({ req }) || u.role === ROLES.BARBER
    },
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) return { barber: { equals: u.activeBarber } }
      return false
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) return { barber: { equals: u.activeBarber } }
      return false
    },
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
      name: 'label',
      type: 'text',
      label: 'عنوان (اعلامیه)',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'allDay',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'slots',
      type: 'array',
      label: 'بازه‌های غیرفعال',
      admin: {
        condition: (data) => data?.allDay === false,
      },
      fields: [
        { name: 'start', type: 'text', required: true },
        { name: 'end', type: 'text', required: true },
      ],
    },
  ],
}
