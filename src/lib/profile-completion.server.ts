/**
 * Shared server helpers for deciding whether an account has completed all its
 * required profile fields (i.e. is "active"). Accounts that are not yet
 * complete are redirected to the profile page after signup/login.
 *
 * This module must stay server-only (it imports Payload types and queries).
 */

import type { Payload } from 'payload'

import { getBarberIdForUser } from './barber-user'
import { ROLES } from '../utils/constants'

type MaybeUser = { id: string | number; name?: string | null; role?: string } | null

/**
 * A customer is complete once they have a name. A barber additionally needs an
 * actual barber profile (shop) with a required shop name + city.
 */
export async function isProfileComplete(
  payload: Payload,
  user: MaybeUser,
): Promise<boolean> {
  if (!user) return false
  if (!user.name || user.name.trim().length === 0) return false
  if (user.role !== ROLES.BARBER) return true

  const barberId = await getBarberIdForUser(payload, String(user.id))
  if (!barberId) return false

  const barber = await payload.findByID({
    collection: 'barbers',
    id: barberId,
    depth: 0,
    overrideAccess: true,
  }).catch(() => null)
  if (!barber) return false

  const shopName = String(barber.shopName ?? '').trim()
  const cityId =
    typeof barber.city === 'object' && barber.city
      ? String(barber.city.id)
      : String(barber.city ?? '')
  return Boolean(shopName && cityId)
}

/**
 * Recomputes and persists a barber shop's `isPublic` flag: a shop is public
 * (active on the site) once its owner has a name AND the shop has a name and a
 * city. Called by hooks on `barbers` and `users` so the flag stays accurate on
 * every profile/shop edit (incl. admin panel).
 */
export async function syncBarberPublic(
  payload: Payload,
  barberId: string,
): Promise<void> {
  const barber = await payload
    .findByID({ collection: 'barbers', id: barberId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!barber) return

  const ownerId =
    typeof barber.user === 'object' && barber.user
      ? String(barber.user.id)
      : String(barber.user ?? '')
  const owner = ownerId
    ? await payload
        .findByID({ collection: 'users', id: ownerId, depth: 0, overrideAccess: true })
        .catch(() => null)
    : null

  const cityId =
    typeof barber.city === 'object' && barber.city
      ? String(barber.city.id)
      : String(barber.city ?? '')
  const complete = Boolean(
    owner?.name?.trim() &&
      String(barber.shopName ?? '').trim() &&
      cityId,
  )

  if (Boolean(barber.isPublic) !== complete) {
    await payload.update({
      collection: 'barbers',
      id: barberId,
      data: { isPublic: complete },
      overrideAccess: true,
    })
  }
}
