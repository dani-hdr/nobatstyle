import type { CollectionConfig } from 'payload'
import type { Role } from '../utils/constants'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    group: 'کاربران',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    verify: false,
  },
  access: {
    read: ({ req }) => isAdmin({ req }),
    create: () => true,
    update: ({ req }) => {
      if (!req.user) return false
      return isAdmin({ req }) || Boolean(req.user)
    },
    delete: ({ req }) => isAdmin({ req }),
    admin: ({ req }) => isAdmin({ req }),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: ROLES.CUSTOMER,
      saveToJWT: true,
      options: [
        { label: 'مشتری', value: ROLES.CUSTOMER },
        { label: 'آرایشگر', value: ROLES.BARBER },
        { label: 'مدیر', value: ROLES.ADMIN },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'کاربر تأیید شده است',
      },
    },
    {
      name: 'activeBarber',
      type: 'relationship',
      relationTo: 'barbers',
      hasMany: false,
      admin: {
        position: 'sidebar',
        condition: (data, siblingData) => data?.role === ROLES.BARBER,
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      access: {
        read: () => true,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
