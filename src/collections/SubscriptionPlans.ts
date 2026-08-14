import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Subscription plans are backend-managed so the frontend never hardcodes prices
 * or durations. Payment is out of scope at this stage; plans are catalog data.
 */
export const SubscriptionPlans: CollectionConfig = {
  slug: 'subscriptionPlans',
  admin: {
    useAsTitle: 'name',
    group: 'اشتراک',
    defaultColumns: ['name', 'durationMonths', 'price', 'isActive'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام پلن',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'durationMonths',
      type: 'number',
      required: true,
      min: 1,
      admin: { position: 'sidebar' },
    },
    {
      name: 'features',
      type: 'array',
      label: 'امکانات',
      fields: [{ name: 'feature', type: 'text' }],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
