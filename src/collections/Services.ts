import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    group: 'خدمات',
    defaultColumns: ['name', 'barber', 'duration', 'price', 'isActive'],
  },
  access: {
    // Everyone can read active services; barbers/admins read all.
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
      // Barbers can only manage their own services.
      if (u.role === ROLES.BARBER) {
        return { barber: { equals: u.activeBarber } }
      }
      return false
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        return { barber: { equals: u.activeBarber } }
      }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام خدمت',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات',
    },
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        condition: (data, siblingData, { user }) => user?.role !== ROLES.BARBER,
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 5,
      admin: {
        position: 'sidebar',
        description: 'مدت زمان به دقیقه',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
