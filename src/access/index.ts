import type { Access, PayloadRequest } from 'payload'
import { ROLES } from '../utils/constants'

/**
 * Allow only authenticated users.
 */
export const anyLoggedIn = ({ req }: { req: PayloadRequest }): boolean => Boolean(req.user)

/**
 * Allow only admins. Declared as a plain function returning `boolean` so it can
 * be assigned to boolean-only access slots (e.g. auth `admin`) as well as
 * row-constraint access slots.
 */
export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => req.user?.role === ROLES.ADMIN

/**
 * Row-level constraint: a user can only access their own documents.
 * Admins pass through. Returns owner ID for the related user.
 */
export const isSelf: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user.role === ROLES.ADMIN) return true
  return { user: { equals: user.id } }
}
