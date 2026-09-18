import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'
import { TICKET_CATEGORIES } from '../lib/ticket-types'

/**
 * Support tickets opened by customers/barbers and answered by admins. The
 * conversation lives inline as a `messages` array so a ticket is a single
 * atomic document. Raw writes are disabled — creation, replies and status
 * changes go through the `/api/support/tickets` endpoints, while admins can
 * still review and edit tickets from the admin panel.
 */
export const Tickets: CollectionConfig = {
  slug: 'tickets',
  labels: {
    singular: 'تیکت پشتیبانی',
    plural: 'تیکت‌های پشتیبانی',
  },
  admin: {
    useAsTitle: 'subject',
    group: 'ارتباطات',
    defaultColumns: ['subject', 'user', 'category', 'status', 'priority', 'lastMessageAt'],
  },
  access: {
    read: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { user: { equals: u.id } }
    },
    // Creation goes through POST /api/support/tickets only, so the raw REST
    // create is disabled (the endpoint uses overrideAccess).
    create: () => false,
    update: ({ req }) => isAdmin({ req }),
    delete: ({ req }) => isAdmin({ req }),
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && req.user.role !== ROLES.ADMIN && !data.user) {
          data.user = req.user.id
        }
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          data.lastMessageAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
      maxLength: 150,
      label: 'موضوع',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'کاربر',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'general',
      label: 'دسته‌بندی',
      options: TICKET_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      label: 'وضعیت',
      options: [
        { label: 'باز', value: 'open' },
        { label: 'پاسخ داده شده', value: 'answered' },
        { label: 'بسته شده', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      label: 'اولویت',
      options: [
        { label: 'کم', value: 'low' },
        { label: 'معمولی', value: 'normal' },
        { label: 'زیاد', value: 'high' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'messages',
      type: 'array',
      label: 'گفتگو',
      labels: { singular: 'پیام', plural: 'پیام‌ها' },
      admin: {
        description: 'پیام‌های رد و بدل شده؛ پیام‌های پشتیبانی را با فرستنده «پشتیبانی» ثبت کنید.',
      },
      fields: [
        {
          name: 'from',
          type: 'select',
          required: true,
          defaultValue: 'staff',
          label: 'فرستنده',
          options: [
            { label: 'کاربر', value: 'user' },
            { label: 'پشتیبانی', value: 'staff' },
          ],
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
          maxLength: 2000,
          label: 'متن',
        },
      ],
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      index: true,
      label: 'زمان آخرین پیام',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
