import type { Endpoint as PayloadEndpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { getBarberIdForUser } from '../lib/barber-user'
import { ROLES } from '../utils/constants'

type RequestDoc = {
  id: string | number
  barber: string | number | { id: string | number }
  customer: string | number | { id: string | number; name?: string | null; username?: string }
  status: 'pending' | 'approved' | 'rejected'
}

function asId(rel: RequestDoc['barber'] | RequestDoc['customer']): string {
  return String(typeof rel === 'object' && rel ? rel.id : rel)
}

async function appendBarberCustomer(
  req: PayloadRequest,
  barberId: string,
  customerId: string,
): Promise<void> {
  const barber = await req.payload.findByID({
    collection: 'barbers',
    id: barberId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const existing = (barber.customers ?? []).map((c) => String(typeof c === 'object' ? c.id : c))
  if (existing.includes(customerId)) return
  await req.payload.update({
    collection: 'barbers',
    id: barberId,
    data: { customers: [...existing, customerId] },
    overrideAccess: true,
    req,
  })
}

async function notify(
  req: PayloadRequest,
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  await req.payload.create({
    collection: 'notifications',
    data: { user: userId, type: 'system', title, body },
    overrideAccess: true,
    req,
  })
}

/**
 * POST /api/barber-requests/send
 * Body: { barberId }. The logged-in customer asks to become the barber's
 * customer. Idempotent while a pending/approved request already exists.
 *
 * NOTE: declared as a collection-level endpoint (see BarberRequests) because
 * a ROOT endpoint under `/barber-requests/…` would be shadowed by the
 * collection's own REST router.
 */
export const barberRequestSendEndpoint: PayloadEndpoint = {
  path: '/send',
  method: 'post',
  handler: async (req) => {
    if (!req.user) throw new APIError('برای ثبت درخواست ابتدا وارد حساب کاربری شوید', 401)
    if (req.user.role !== ROLES.CUSTOMER) {
      throw new APIError('فقط مشتری‌ها می‌توانند درخواست ثبت کنند', 403)
    }

    let body: { barberId?: unknown }
    try {
      body = (await req.json?.()) as { barberId?: unknown }
    } catch {
      throw new APIError('درخواست نامعتبر است', 400)
    }
    const barberId =
      typeof body?.barberId === 'string' || typeof body?.barberId === 'number'
        ? String(body.barberId)
        : ''
    if (!barberId) throw new APIError('شناسه آرایشگر الزامی است', 400)

    const barber = await req.payload.findByID({
      collection: 'barbers',
      id: barberId,
      depth: 0,
      overrideAccess: true,
      req,
    }).catch(() => null)
    if (!barber) throw new APIError('آرایشگر یافت نشد', 404)

    // Already listed as a customer? Nothing to request.
    const customers = (barber.customers ?? []).map((c) =>
      String(typeof c === 'object' ? c.id : c),
    )
    if (customers.includes(String(req.user.id))) {
      return Response.json({ status: 'approved' as const })
    }

    const existingRes = await req.payload.find({
      collection: 'barber-requests',
      where: {
        and: [
          { barber: { equals: barberId } },
          { customer: { equals: String(req.user.id) } },
          { status: { in: ['pending', 'approved'] } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const existing = existingRes.docs[0]
    if (existing) {
      return Response.json({ status: existing.status as 'pending' | 'approved' })
    }

    await req.payload.create({
      collection: 'barber-requests',
      data: {
        barber: barberId,
        customer: String(req.user.id),
        status: 'pending',
      },
      overrideAccess: true,
      req,
    })

    await notify(
      req,
      String(typeof barber.user === 'object' ? barber.user?.id : barber.user),
      'درخواست مشتری جدید',
      `${req.user.name || req.user.username} درخواست ثبت‌نام به‌عنوان مشتری شما را دارد.`,
    )

    return Response.json({ status: 'pending' as const })
  },
}

/** Shared logic for POST /api/barber-requests/:id/approve|reject */async function decideRequest(
  req: PayloadRequest,
  decision: 'approved' | 'rejected',
): Promise<Response> {
  if (!req.user) throw new APIError('Unauthorized', 401)

  const id = String(req.routeParams?.['id'])
  const request = await req.payload.findByID({
    collection: 'barber-requests',
    id,
    depth: 0,
    overrideAccess: true,
    req,
  }).catch(() => null)
  if (!request) throw new APIError('درخواست یافت نشد', 404)

  const doc = request as unknown as RequestDoc
  const barberId = asId(doc.barber)
  const customerId = asId(doc.customer)

  if (req.user.role !== ROLES.ADMIN) {
    const ownBarberId = await getBarberIdForUser(req.payload, String(req.user.id))
    if (!ownBarberId || ownBarberId !== barberId) {
      throw new APIError('فقط آرایشگر می‌تواند به این درخواست پاسخ دهد', 403)
    }
  }

  if (doc.status === decision) {
    return Response.json({ ok: true, status: decision })
  }
  if (doc.status === 'rejected') {
    throw new APIError('این درخواست قبلاً رد شده است', 409)
  }

  await req.payload.update({
    collection: 'barber-requests',
    id,
    data: { status: decision },
    overrideAccess: true,
    req,
  })

  if (decision === 'approved') {
    // Membership drives both booking permission and the «آرایشگر شما» badge.
    await appendBarberCustomer(req, barberId, customerId)
    await notify(
      req,
      customerId,
      'درخواست شما تایید شد',
      'حالا می‌توانید نوبت خود را رزرو کنید.',
    )
  } else {
    await notify(
      req,
      customerId,
      'درخواست شما رد شد',
      'متاسفانه آرایشگر درخواست شما را نپذیرفت.',
    )
  }

  return Response.json({ ok: true, status: decision })
}

export const barberRequestApproveEndpoint: PayloadEndpoint = {
  path: '/:id/approve',
  method: 'post',
  handler: async (req) => decideRequest(req, 'approved'),
}

export const barberRequestRejectEndpoint: PayloadEndpoint = {
  path: '/:id/reject',
  method: 'post',
  handler: async (req) => decideRequest(req, 'rejected'),
}
