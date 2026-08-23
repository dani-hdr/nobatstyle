import type { Payload } from 'payload'

/**
 * Resolves the barber profile owned by a user account. Used wherever code
 * previously relied on `req.user.activeBarber`, which was never populated —
 * JWT claims are not merged back into `req.user`, so the value was always
 * undefined and every barber-scoped query silently returned nothing.
 */
export async function getBarberIdForUser(
  payload: Payload,
  userId: string,
): Promise<string | null> {
  const { docs } = await payload.find({
    collection: 'barbers',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  return docs[0] ? String(docs[0].id) : null
}
