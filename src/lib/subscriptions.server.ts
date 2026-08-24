import type { Payload } from 'payload'

import type { SubscriptionPlan, Subscription as SubscriptionsDoc } from '@/payload-types'

export type SubscriptionState = {
  /** trial → within free window; active → covered (plan or enforcement off); expired → must purchase. */
  mode: 'trial' | 'active' | 'expired'
  /** Days left in the current window; null = unlimited (enforcement disabled). */
  daysLeft: number | null
  windowEndsAt: string | null
  plan: { id: string; name: string } | null
}

export type MonetizationSettings = {
  enforceSubscription: boolean
  trialDays: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS))
}

export async function getMonetizationSettings(payload: Payload): Promise<MonetizationSettings> {
  const settings = await payload.findGlobal({
    slug: 'settings',
    depth: 0,
    overrideAccess: true,
  })
  const m = settings.monetization
  return {
    enforceSubscription: m?.enforceSubscription ?? true,
    trialDays: m?.trialDays ?? 14,
  }
}

/** Newest non-cancelled subscription still covering today. */
export async function getActiveSubscription(
  payload: Payload,
  barberId: string,
): Promise<(SubscriptionsDoc & { plan?: string | SubscriptionPlan }) | null> {
  const nowIso = new Date().toISOString()
  const { docs } = await payload.find({
    collection: 'subscriptions',
    depth: 1,
    where: {
      and: [
        { barber: { equals: barberId } },
        { status: { equals: 'active' } },
        { expiresAt: { greater_than: nowIso } },
      ],
    },
    sort: '-expiresAt',
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

/**
 * Full subscription state for a barber profile: free trial measured from the
 * profile's creation, then the latest purchased plan, else expired.
 */
export async function getBarberSubscriptionState(
  payload: Payload,
  barberId: string,
): Promise<SubscriptionState> {
  const [barber, sub, monetization] = await Promise.all([
    payload.findByID({ collection: 'barbers', id: barberId, depth: 0, overrideAccess: true }),
    getActiveSubscription(payload, barberId),
    getMonetizationSettings(payload),
  ])

  if (sub) {
    const planRef = typeof sub.plan === 'object' ? sub.plan : null
    const expiresAt = new Date(sub.expiresAt).toISOString()
    return {
      mode: 'active',
      daysLeft: daysUntil(expiresAt),
      windowEndsAt: expiresAt,
      plan: planRef ? { id: String(planRef.id), name: planRef.name } : null,
    }
  }

  if (!monetization.enforceSubscription) {
    return { mode: 'active', daysLeft: null, windowEndsAt: null, plan: null }
  }

  const createdAt = barber?.createdAt ?? new Date().toISOString()
  const trialEndsAt = new Date(
    new Date(createdAt).getTime() + monetization.trialDays * DAY_MS,
  ).toISOString()

  if (new Date(trialEndsAt).getTime() > Date.now()) {
    return {
      mode: 'trial',
      daysLeft: daysUntil(trialEndsAt),
      windowEndsAt: trialEndsAt,
      plan: null,
    }
  }

  return { mode: 'expired', daysLeft: 0, windowEndsAt: trialEndsAt, plan: null }
}

/** Whether a barber may accept bookings right now (customers are always free). */
export async function canAcceptBookings(payload: Payload, barberId: string): Promise<boolean> {
  const state = await getBarberSubscriptionState(payload, barberId)
  return state.mode !== 'expired'
}

/**
 * Ids of the given barbers whose trial/subscription has lapsed (i.e. they
 * cannot accept bookings). One batched subscriptions query + one settings read.
 */
export async function getExpiredBarberIds(
  payload: Payload,
  barbers: { id: string; createdAt?: string | null }[],
): Promise<Set<string>> {
  const expired = new Set<string>()
  if (barbers.length === 0) return expired

  const nowIso = new Date().toISOString()
  const [subRes, monetization] = await Promise.all([
    payload.find({
      collection: 'subscriptions',
      depth: 0,
      where: {
        and: [
          { barber: { in: barbers.map((b) => b.id) } },
          { status: { equals: 'active' } },
          { expiresAt: { greater_than: nowIso } },
        ],
      },
      limit: 1000,
      overrideAccess: true,
    }),
    getMonetizationSettings(payload),
  ])

  const covered = new Set<string>(
    subRes.docs.map((s) =>
      String(typeof s.barber === 'object' && s.barber ? s.barber.id : s.barber),
    ),
  )

  for (const b of barbers) {
    if (covered.has(b.id)) continue
    if (!monetization.enforceSubscription) continue
    const createdAt = b.createdAt ?? nowIso
    if (new Date(createdAt).getTime() + monetization.trialDays * DAY_MS > Date.now()) continue
    expired.add(b.id)
  }
  return expired
}
