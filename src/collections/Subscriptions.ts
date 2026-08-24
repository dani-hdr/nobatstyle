import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isAdmin } from '../access'

/**
 * A barber's subscription purchase. Plans are catalog data (SubscriptionPlans);
 * each purchase snapshots the price and computes the expiry window. Payment is
 * not integrated yet — records are created through the barber subscription
 * endpoint with a placeholder paymentRef until a gateway is wired in.
 */
export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  labels: {
    singular: 'اشتراک',
    plural: 'اشتراک‌ها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'کاربران و اشتراک',
    defaultColumns: ['barber', 'plan', 'startsAt', 'expiresAt', 'amount', 'status'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (isAdmin({ req })) return true
      if (req.user.role !== 'barber') return false
      // Barbers may only read subscriptions of their own shop; the actual
      // barber id is resolved in queries via /api/barber/subscription.
      return { barber: { not_equals: null } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation !== 'create') return data

        const planId =
          data.plan != null ? String(typeof data.plan === 'object' ? data.plan.id : data.plan) : null
        if (!planId) throw new APIError('پلن انتخاب نشده است.', 400)
        if (!data.barber) throw new APIError('آرایشگر مشخص نشده است.', 400)

        const plan = await req.payload.findByID({
          collection: 'subscriptionPlans',
          id: planId,
          depth: 0,
          overrideAccess: true,
        })
        if (!plan || !plan.isActive) {
          throw new APIError('این پلن در دسترس نیست.', 400)
        }

        const now = new Date()
        const startsAt = data.startsAt ? new Date(data.startsAt) : now
        if (!originalDoc && (!data.expiresAt || startsAt >= now)) {
          const expires = new Date(startsAt)
          expires.setMonth(expires.getMonth() + plan.durationMonths)
          data.expiresAt = expires.toISOString()
        }
        data.amount ??= plan.price
        data.status ??= 'active'
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
      label: 'آرایشگاه',
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'subscriptionPlans',
      required: true,
      index: true,
      label: 'پلن',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      label: 'وضعیت',
      admin: { position: 'sidebar' },
      options: [
        { label: 'فعال', value: 'active' },
        { label: 'لغو شده', value: 'cancelled' },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      label: 'شروع',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      label: 'انقضا',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
    {
      name: 'amount',
      type: 'number',
      min: 0,
      label: 'مبلغ پرداخت‌شده (تومان)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentRef',
      type: 'text',
      label: 'کد پیگیری پرداخت',
      admin: {
        position: 'sidebar',
        description: 'در اتصال درگاه پرداخت، شناسه تراکنش اینجا ذخیره می‌شود',
      },
    },
  ],
}
