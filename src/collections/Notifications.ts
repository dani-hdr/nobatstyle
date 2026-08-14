import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    group: 'اعلان‌ها',
  },
  access: {
    read: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { user: { equals: u.id } }
    },
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      // Users may create notifications for their own context; admins anywhere.
      return isAdmin({ req }) || Boolean(u)
    },
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { user: { equals: u.id } }
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { user: { equals: u.id } }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'رزرو', value: 'appointment' },
        { label: 'پیام', value: 'message' },
        { label: 'سیستم', value: 'system' },
        { label: 'اشتراک', value: 'subscription' },
      ],
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
    },
    {
      name: 'readAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'داده اضافی ساختاریافته برای هدایت کاربر',
      },
    },
  ],
}
