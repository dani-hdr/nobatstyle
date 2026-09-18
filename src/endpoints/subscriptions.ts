import type { Endpoint as PayloadEndpoint } from 'payload'
import { APIError } from 'payload'

import { getBarberIdForUser } from '../lib/barber-user'
import { getBarberSubscriptionState, getMonetizationSettings } from '../lib/subscriptions.server'
import { ROLES } from '../utils/constants'

function requireBarber(req: { user?: { id: string; role?: string } | null }): string {
  const u = req.user
  if (!u) throw new APIError('Unauthorized', 401)
  if (u.role !== ROLES.BARBER) throw new APIError('Forbidden', 403)
  return u.id
}

/**
 * GET /api/barber/subscription
 * Current subscription state (trial/active/expired), purchasable plans and
 * purchase history for the signed-in barber.
 */
export const barberSubscriptionGetEndpoint: PayloadEndpoint = {
  path: '/barber/subscription',
  method: 'get',
  handler: async (req) => {
    const userId = requireBarber(req)
    const barberId = await getBarberIdForUser(req.payload, userId)
    if (!barberId) throw new APIError('پروفایل آرایشگر یافت نشد', 404)

    const [state, plansRes, historyRes, monetization] = await Promise.all([
      getBarberSubscriptionState(req.payload, barberId),
      req.payload.find({
        collection: 'subscriptionPlans',
        depth: 0,
        where: { isActive: { equals: true } },
        sort: 'sortOrder',
        limit: 20,
      }),
      req.payload.find({
        collection: 'subscriptions',
        depth: 1,
        where: { barber: { equals: barberId } },
        sort: '-createdAt',
        limit: 12,
      }),
      getMonetizationSettings(req.payload),
    ])

    return Response.json({
      state,
      monetization,
      plans: plansRes.docs.map((p) => ({
        id: String(p.id),
        name: p.name,
        description: p.description ?? null,
        price: p.price,
        durationMonths: p.durationMonths,
        features: (p.features ?? []).map((f) => f.feature).filter(Boolean),
      })),
      history: historyRes.docs.map((s) => ({
        id: String(s.id),
        planName:
          typeof s.plan === 'object' && s.plan ? s.plan.name : null,
        amount: s.amount ?? null,
        status: s.status,
        startsAt: s.startsAt,
        expiresAt: s.expiresAt,
      })),
    })
  },
}

/**
 * POST /api/barber/subscription  body: { planId }
 * Activates a plan for the signed-in barber. Payment gateway is not wired yet —
 * the purchase is recorded instantly with a placeholder paymentRef; swap the
 * marked block for a real checkout flow later.
 */
export const barberSubscriptionPurchaseEndpoint: PayloadEndpoint = {
  path: '/barber/subscription',
  method: 'post',
  handler: async (req) => {
    const userId = requireBarber(req)
    const barberId = await getBarberIdForUser(req.payload, userId)
    if (!barberId) throw new APIError('پروفایل آرایشگر یافت نشد', 404)

    const body = (await req.json?.()) ?? {}
    const planId = body?.planId ? String(body.planId) : null
    if (!planId) throw new APIError('پلن انتخاب نشده است.', 400)

    const plan = await req.payload.findByID({
      collection: 'subscriptionPlans',
      id: planId,
      depth: 0,
      overrideAccess: true,
    })
    if (!plan || !plan.isActive) throw new APIError('این پلن در دسترس نیست.', 400)

    // Renewals stack on top of the current window instead of losing paid days.
    const now = new Date()
    let base = now
    const current = await req.payload.find({
      collection: 'subscriptions',
      depth: 0,
      where: {
        and: [
          { barber: { equals: barberId } },
          { status: { equals: 'active' } },
          { expiresAt: { greater_than: now.toISOString() } },
        ],
      },
      sort: '-expiresAt',
      limit: 1,
      overrideAccess: true,
    })
    const currentSub = current.docs[0]
    if (currentSub && new Date(currentSub.expiresAt).getTime() > base.getTime()) {
      base = new Date(currentSub.expiresAt)
    }

    const expiresAt = new Date(base)
    expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths)

    // --- payment placeholder -------------------------------------------
    // Replace with gateway redirect + callback verification. The record below
    // is what the callback would create after confirming payment.
    const paymentRef = `manual-${Date.now().toString(36)}`
    // --------------------------------------------------------------------

    const sub = await req.payload.create({
      collection: 'subscriptions',
      data: {
        barber: barberId,
        plan: planId,
        status: 'active',
        startsAt: base.toISOString(),
        expiresAt: expiresAt.toISOString(),
        amount: plan.price,
        paymentRef,
      },
      depth: 1,
      overrideAccess: true,
      req,
    })

    const state = await getBarberSubscriptionState(req.payload, barberId)
    return Response.json({ subscriptionId: String(sub.id), state })
  },
}
