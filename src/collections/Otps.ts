import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

/**
 * Stores pending one-time passwords for customer/barber OTP login. Codes are
 * stored hashed (never plaintext) and expire after a short window. Records are
 * only accessible to admins; the login endpoints touch them via the local API
 * (`overrideAccess`).
 */
export const Otps: CollectionConfig = {
  slug: 'otps',
  labels: {
    singular: 'کد یکبارمصرف',
    plural: 'کدهای یکبارمصرف',
  },
  admin: {
    group: 'کاربران و اشتراک',
    defaultColumns: ['phone', 'role', 'expiresAt', 'used', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      index: true,
      label: 'شماره تماس',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: ROLES.CUSTOMER,
      label: 'نقش',
      options: [
        { label: 'مشتری', value: ROLES.CUSTOMER },
        { label: 'آرایشگر', value: ROLES.BARBER },
      ],
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      label: 'کد (هش‌شده)',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      label: 'انقضا',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'used',
      type: 'checkbox',
      defaultValue: false,
      label: 'استفاده‌شده',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
