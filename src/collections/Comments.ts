import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

/**
 * Free-form comments users leave on a barber profile. Kept separate from
 * `reviews` (which carry a rating and feed the denormalized barber score).
 * New comments start as `pending` and only `active` ones render on the site.
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: 'دیدگاه',
    plural: 'دیدگاه‌ها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['barber', 'author', 'content', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if (!req.user) return false
      if (isAdmin({ req })) return true
      // Authors may edit their own pending comments only.
      if (req.user.role === ROLES.CUSTOMER) {
        return { author: { equals: req.user.id } }
      }
      return false
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (isAdmin({ req })) return true
      return { author: { equals: req.user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && !data.author) {
          data.author = req.user.id
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
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'نویسنده',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 500,
      label: 'متن دیدگاه',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'وضعیت',
      admin: {
        position: 'sidebar',
      },
      options: [
        { label: 'در انتظار', value: 'pending' },
        { label: 'نمایش', value: 'active' },
        { label: 'رد شده', value: 'rejected' },
      ],
    },
  ],
}
