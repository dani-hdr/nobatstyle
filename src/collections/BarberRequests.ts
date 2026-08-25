import type { CollectionConfig, Where } from 'payload'

import { isAdmin } from '../access'
import {
  barberRequestApproveEndpoint,
  barberRequestRejectEndpoint,
  barberRequestSendEndpoint,
} from '../endpoints/barber-requests'
import { getBarberIdForUser } from '../lib/barber-user'
import { ROLES } from '../utils/constants'

export const BARBER_REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const

/**
 * A customer's membership request for a barber shop. While a request is
 * «pending» the customer cannot book; once the barber approves it, the
 * customer may reserve appointments and sees the «آرایشگر شما» badge.
 */
export const BarberRequests: CollectionConfig = {
  slug: 'barber-requests',
  labels: {
    singular: 'درخواست مشتری',
    plural: 'درخواست‌های مشتریان',
  },
  admin: {
    useAsTitle: 'id',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['barber', 'customer', 'status', 'createdAt'],
  },
  endpoints: [
    barberRequestSendEndpoint,
    barberRequestApproveEndpoint,
    barberRequestRejectEndpoint,
  ],
  access: {
    read: async ({ req }) => {
      const u = req.user
      if (!u) return false
      if (u.role === ROLES.ADMIN) return true
      if (u.role === ROLES.CUSTOMER) return { customer: { equals: String(u.id) } }
      if (u.role === ROLES.BARBER) {
        return ownBarberRequestWhere(req.payload, String(u.id))
      }
      return false
    },
    create: ({ req }) => {
      // Creation goes through POST /api/barber-requests/send only, so the
      // raw REST create is disabled (the endpoint uses overrideAccess).
      void req
      return false
    },
    update: ({ req }) => {
      // Status transitions happen only through the approve/reject endpoints.
      return isAdmin({ req })
    },
    delete: ({ req }) => Boolean(isAdmin({ req })),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data && !data.customer && req.user) {
          data.customer = String(req.user.id)
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
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'مشتری',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      label: 'وضعیت',
      options: [
        { label: 'در انتظار تایید', value: 'pending' },
        { label: 'تایید شده', value: 'approved' },
        { label: 'رد شده', value: 'rejected' },
      ],
    },
  ],
}

/** Row constraint limiting a barber to requests sent to their own shop. */
export async function ownBarberRequestWhere(
  payload: Parameters<typeof getBarberIdForUser>[0],
  userId: string,
): Promise<Where | false> {
  const barberId = await getBarberIdForUser(payload, userId)
  if (!barberId) return false
  return { barber: { equals: barberId } }
}
