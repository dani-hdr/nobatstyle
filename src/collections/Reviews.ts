import type { CollectionConfig, PayloadRequest } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

async function updateBarberStats(req: PayloadRequest, barberId: string) {
  const res = await req.payload.find({
    collection: 'reviews',
    depth: 0,
    limit: 0,
    where: {
      and: [{ barber: { equals: barberId } }, { status: { equals: 'active' } }],
    },
  })
  const total = res.docs.length
  const sum = res.docs.reduce((acc, r) => acc + (r.rating || 0), 0)
  const rating = total ? Math.round((sum / total) * 10) / 10 : 0
  await req.payload.update({
    collection: 'barbers',
    id: barberId,
    data: { rating, reviewCount: total },
    req,
    overrideAccess: true,
  })
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'id',
    group: 'بازخورد',
    defaultColumns: ['barber', 'customer', 'rating', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      // Only a customer who actually booked a completed appointment may review.
      return u.role === ROLES.CUSTOMER || isAdmin({ req })
    },
    update: ({ req }) => isAdmin({ req }),
    delete: ({ req }) => isAdmin({ req }),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc.barber) return
        await updateBarberStats(req, doc.barber as string)
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (doc?.barber) await updateBarberStats(req, doc.barber as string)
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
      name: 'appointment',
      type: 'relationship',
      relationTo: 'appointments',
      admin: { position: 'sidebar' },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: { position: 'sidebar' },
    },
    {
      name: 'comment',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      admin: { position: 'sidebar' },
      options: [
        { label: 'در انتظار', value: 'pending' },
        { label: 'نمایش', value: 'active' },
        { label: 'رد شده', value: 'rejected' },
      ],
    },
  ],
}
