import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'
import { getBarberIdForUser } from '../lib/barber-user'

/**
 * Barber portfolio images, served to the frontend via the API so image URLs
 * never need to be hardcoded client-side.
 */
export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
  labels: {
    singular: 'تصویر نمونه‌کار',
    plural: 'نمونه‌کارها',
  },
  admin: {
    useAsTitle: 'title',
    group: 'آرایشگاه‌ها',
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      return isAdmin({ req }) || u.role === ROLES.BARBER
    },
    update: async ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        const barberId = await getBarberIdForUser(req.payload, u.id)
        return barberId ? { barber: { equals: barberId } } : false
      }
      return false
    },
    delete: async ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        const barberId = await getBarberIdForUser(req.payload, u.id)
        return barberId ? { barber: { equals: barberId } } : false
      }
      return false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'عنوان',
    },
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
      required: true,
      index: true,
      label: 'آرایشگر',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'تصویر',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}
