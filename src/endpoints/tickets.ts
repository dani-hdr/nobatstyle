import type { Endpoint as PayloadEndpoint, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { ROLES } from '../utils/constants'

const MAX_SUBJECT_LENGTH = 150
const MAX_BODY_LENGTH = 2000

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>

function requireUser(req: PayloadRequest): { id: string; role?: string } {
  const u = req.user
  if (!u) throw new APIError('برای استفاده از پشتیبانی ابتدا وارد حساب کاربری شوید.', 401)
  return u as { id: string; role?: string }
}

function isStaff(role?: string): boolean {
  return role === ROLES.ADMIN
}

function readIdParam(req: PayloadRequest): string {
  const id = req.routeParams?.['id']
  if (!id) throw new APIError('شناسه تیکت یافت نشد.', 400)
  return String(id)
}

/** Loads a ticket and enforces that the caller owns it (or is an admin). */
async function getAccessibleTicket(
  req: PayloadRequest,
  user: { id: string; role?: string },
): Promise<AnyDoc> {
  const ticket = await req.payload
    .findByID({
      collection: 'tickets',
      id: readIdParam(req),
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null)
  if (!ticket) throw new APIError('تیکت یافت نشد.', 404)

  const owner = ticket.user as unknown
  const ownerId =
    owner && typeof owner === 'object' ? String((owner as AnyDoc).id) : String(owner)
  if (!isStaff(user.role) && ownerId !== String(user.id)) {
    throw new APIError('دسترسی به این تیکت مجاز نیست.', 403)
  }
  return ticket as AnyDoc
}

function messageList(ticket: AnyDoc): AnyDoc[] {
  return Array.isArray(ticket.messages) ? (ticket.messages as AnyDoc[]) : []
}

function serializeSummary(ticket: AnyDoc) {
  const messages = messageList(ticket)
  const last = messages[messages.length - 1]
  return {
    id: String(ticket.id),
    subject: ticket.subject ?? '',
    category: ticket.category ?? 'general',
    status: ticket.status ?? 'open',
    priority: ticket.priority ?? 'normal',
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    lastMessageAt: ticket.lastMessageAt ?? ticket.updatedAt ?? ticket.createdAt,
    messageCount: messages.length,
    lastMessage: last?.body ?? null,
    lastFrom: last?.from ?? null,
  }
}

function serializeDetail(ticket: AnyDoc) {
  const messages = messageList(ticket).map((m) => ({
    id: String(m.id),
    from: m.from ?? 'user',
    body: m.body ?? '',
    createdAt: m.createdAt ?? ticket.createdAt,
  }))
  return { ...serializeSummary(ticket), messages }
}

/** Validates the shared subject/message input used by create + reply. */
function readText(body: AnyDoc, field: string, max: number, label: string): string {
  const value = String(body?.[field] ?? '').trim()
  if (!value) throw new APIError(`${label} الزامی است.`, 400)
  if (value.length > max) throw new APIError(`${label} بیش از حد طولانی است.`, 400)
  return value
}

/**
 * GET /api/support/tickets
 * The signed-in user's tickets (all tickets for admins), newest activity first.
 */
export const ticketsListEndpoint: PayloadEndpoint = {
  path: '/support/tickets',
  method: 'get',
  handler: async (req) => {
    const user = requireUser(req)
    const where: Where = isStaff(user.role)
      ? {}
      : { user: { equals: String(user.id) } }

    const { docs } = await req.payload.find({
      collection: 'tickets',
      where,
      depth: 0,
      sort: '-lastMessageAt',
      limit: 100,
      overrideAccess: true,
      req,
    })

    return Response.json({ docs: (docs as AnyDoc[]).map(serializeSummary) })
  },
}

/**
 * POST /api/support/tickets
 * Opens a new ticket with its first message. Body: { subject, category, message }.
 */
export const ticketCreateEndpoint: PayloadEndpoint = {
  path: '/support/tickets',
  method: 'post',
  handler: async (req) => {
    const user = requireUser(req)
    if (isStaff(user.role)) throw new APIError('مدیران تیکت پشتیبانی ایجاد نمی‌کنند.', 403)

    const body = ((await req.json?.()) ?? {}) as AnyDoc
    const subject = readText(body, 'subject', MAX_SUBJECT_LENGTH, 'موضوع')
    const message = readText(body, 'message', MAX_BODY_LENGTH, 'متن پیام')
    const category =
      typeof body.category === 'string' ? (body.category as AnyDoc['category']) : 'general'
    const now = new Date().toISOString()

    const ticket = await req.payload.create({
      collection: 'tickets',
      data: {
        subject,
        category,
        user: String(user.id),
        status: 'open',
        priority: 'normal',
        messages: [{ from: 'user', body: message }],
        lastMessageAt: now,
      },
      depth: 0,
      overrideAccess: true,
      req,
    })

    return Response.json(serializeDetail(ticket as AnyDoc))
  },
}

/**
 * GET /api/support/tickets/:id
 * Full ticket thread for its owner or an admin.
 */
export const ticketDetailEndpoint: PayloadEndpoint = {
  path: '/support/tickets/:id',
  method: 'get',
  handler: async (req) => {
    const user = requireUser(req)
    const ticket = await getAccessibleTicket(req, user)
    return Response.json(serializeDetail(ticket))
  },
}

/**
 * POST /api/support/tickets/:id/reply
 * Adds a message. A staff reply marks the ticket «answered»; a user reply
 * reopens it. Body: { message }.
 */
export const ticketReplyEndpoint: PayloadEndpoint = {
  path: '/support/tickets/:id/reply',
  method: 'post',
  handler: async (req) => {
    const user = requireUser(req)
    const ticket = await getAccessibleTicket(req, user)
    if (ticket.status === 'closed') {
      throw new APIError('این تیکت بسته شده است؛ برای ادامه آن را باز کنید.', 409)
    }

    const body = ((await req.json?.()) ?? {}) as AnyDoc
    const message = readText(body, 'message', MAX_BODY_LENGTH, 'متن پیام')
    const staff = isStaff(user.role)

    const messages: AnyDoc[] = messageList(ticket).map((m) => ({
      id: m.id,
      from: m.from,
      body: m.body,
    }))
    messages.push({ from: staff ? 'staff' : 'user', body: message })

    const updated = await req.payload.update({
      collection: 'tickets',
      id: String(ticket.id),
      data: {
        messages,
        lastMessageAt: new Date().toISOString(),
        status: staff ? 'answered' : 'open',
      },
      depth: 0,
      overrideAccess: true,
      req,
    })

    return Response.json(serializeDetail(updated as AnyDoc))
  },
}

/** POST /api/support/tickets/:id/close — owner or admin closes the ticket. */
export const ticketCloseEndpoint: PayloadEndpoint = {
  path: '/support/tickets/:id/close',
  method: 'post',
  handler: async (req) => {
    const user = requireUser(req)
    const ticket = await getAccessibleTicket(req, user)
    const updated = await req.payload.update({
      collection: 'tickets',
      id: String(ticket.id),
      data: { status: 'closed' },
      depth: 0,
      overrideAccess: true,
      req,
    })
    return Response.json(serializeDetail(updated as AnyDoc))
  },
}

/** POST /api/support/tickets/:id/reopen — owner or admin reopens the ticket. */
export const ticketReopenEndpoint: PayloadEndpoint = {
  path: '/support/tickets/:id/reopen',
  method: 'post',
  handler: async (req) => {
    const user = requireUser(req)
    const ticket = await getAccessibleTicket(req, user)
    const messages = messageList(ticket)
    const lastFrom = messages[messages.length - 1]?.from
    const updated = await req.payload.update({
      collection: 'tickets',
      id: String(ticket.id),
      data: { status: lastFrom === 'staff' ? 'answered' : 'open' },
      depth: 0,
      overrideAccess: true,
      req,
    })
    return Response.json(serializeDetail(updated as AnyDoc))
  },
}
