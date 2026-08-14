import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

/**
 * Barber portfolio images, served to the frontend via the API so image URLs
 * never need to be hardcoded client-side.
 */
export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
      required: true,
      index: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
