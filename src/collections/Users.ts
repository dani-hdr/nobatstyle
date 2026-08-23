import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'کاربر',
    plural: 'کاربران',
  },
  admin: {
    useAsTitle: 'username',
    group: 'کاربران و اشتراک',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    verify: false,
    // Payload 3.88+ defaults useSessions to true, which requires a session id
    // (`sid`) inside the token. Our OTP endpoint signs stateless JWTs without
    // one, so keep sessions off or every OTP login would fail authentication.
    useSessions: false,
    // Login identity is the phone number (username). Email is not required and
    // email/password login is disabled — admins use username+password in the
    // panel, while customers/barbers authenticate via OTP.
    loginWithUsername: {
      requireEmail: false,
      allowEmailLogin: false,
    },
  },
  access: {
    read: ({ req }) => {
      if (isAdmin({ req })) return true
      // Each user may read their own document (needed by /api/users/me).
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
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
      maxLength: 60,
      label: 'نام',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: ROLES.CUSTOMER,
      saveToJWT: true,
      label: 'نقش',
      options: [
        { label: 'مشتری', value: ROLES.CUSTOMER },
        { label: 'آرایشگر', value: ROLES.BARBER },
        { label: 'مدیر', value: ROLES.ADMIN },
      ],
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره تماس',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر پروفایل',
      admin: {
        position: 'sidebar',
      },
    },
  
  ],
}
