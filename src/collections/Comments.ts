import type { CollectionConfig, PayloadRequest } from 'payload'

import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

/** Recomputes the barber's denormalized rating/reviewCount from active comments. */
async function updateBarberStats(req: PayloadRequest, barberId: string) {
  const res = await req.payload.find({
    collection: 'comments',
    depth: 0,
    limit: 0,
    where: {
      and: [{ barber: { equals: barberId } }, { status: { equals: 'active' } }],
    },
  })
  const rated = res.docs.filter((c) => typeof c.rating === 'number')
  const total = res.docs.length
  const sum = rated.reduce((acc, c) => acc + (c.rating || 0), 0)
  const rating = rated.length ? Math.round((sum / rated.length) * 10) / 10 : 0
  await req.payload.update({
    collection: 'barbers',
    id: barberId,
    data: { rating, reviewCount: total },
    req,
    overrideAccess: true,
  })
}

/**
 * Comments users leave on a barber profile. They carry a star rating and feed
 * the denormalized barber score via hooks below.
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
    defaultColumns: ['barber', 'author', 'rating', 'content', 'status'],
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
    afterChange: [
      async ({ doc, req }) => {
        if (!doc.barber) return
        await updateBarberStats(req, String(typeof doc.barber === 'object' ? doc.barber.id : doc.barber))
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (!doc.barber) return
        await updateBarberStats(req, String(typeof doc.barber === 'object' ? doc.barber.id : doc.barber))
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
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'امتیاز',
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
