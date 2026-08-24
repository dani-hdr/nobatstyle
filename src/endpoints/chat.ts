import type { Endpoint as PayloadEndpoint, Payload, Where } from 'payload'
import { APIError } from 'payload'

import { ROLES } from '../utils/constants'

const MAX_MESSAGE_LENGTH = 2000

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>

/** Relationship values arrive as ids (depth 0) or populated docs — normalize. */
function relId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in (value as AnyDoc)) {
    return String((value as AnyDoc).id)
  }
  return String(value)
}

function mediaUrl(value: unknown): string | null {
  if (value && typeof value === 'object' && 'url' in (value as AnyDoc)) {
    return (value as AnyDoc).url ?? null
  }
  return null
}

/**
 * Maps raw conversation docs onto the client-safe shape used by /messages,
 * batch-resolving the other participant (user) and barber profile so each
 * side sees a proper display name/avatar.
 */
async function serializeConversations(
  payload: Payload,
  convos: AnyDoc[],
  meId: string,
  meRole: string,
): Promise<AnyDoc[]> {
  const userIds = new Set<string>()
  const barberIds = new Set<string>()

  for (const c of convos) {
    for (const p of (Array.isArray(c.participants) ? c.participants : []) as unknown[]) {
      const id = relId(p)
      if (id && id !== meId) userIds.add(id)
    }
    const b = relId(c.barber)
    if (b) barberIds.add(b)
  }

  const [usersRes, barbersRes] = await Promise.all([
    userIds.size
      ? payload.find({
          collection: 'users',
          where: { id: { in: [...userIds] } },
          depth: 1,
          limit: 200,
          pagination: false,
          overrideAccess: true,
        })
      : Promise.resolve(null),
    barberIds.size
      ? payload.find({
          collection: 'barbers',
          where: { id: { in: [...barberIds] } },
          depth: 1,
          limit: 200,
          pagination: false,
          overrideAccess: true,
        })
      : Promise.resolve(null),
  ])

  const userById = new Map<string, AnyDoc>(
    (usersRes?.docs ?? []).map((u: AnyDoc) => [String(u.id), u]),
  )
  const barberById = new Map<string, AnyDoc>(
    (barbersRes?.docs ?? []).map((b: AnyDoc) => [String(b.id), b]),
  )

  return convos.map((c) => {
    const participants = ((Array.isArray(c.participants) ? c.participants : []) as unknown[])
      .map(relId)
      .filter((id): id is string => Boolean(id))
    const otherId = participants.find((id) => id !== meId) ?? null
    const other = otherId ? userById.get(otherId) : undefined
    const barberId = relId(c.barber)
    const barber = barberId ? barberById.get(barberId) : undefined

    let title: string
    let subtitle: string | null = null
    let avatarUrl: string | null = null

    if (barber && !(meRole === ROLES.BARBER)) {
      title = barber.shopName
      const city = barber.city
      subtitle = city && typeof city === 'object' ? (city.name ?? null) : null
      avatarUrl = mediaUrl(barber.cover) ?? mediaUrl(other?.avatar)
    } else {
      title = other?.name || other?.username || 'کاربر'
      avatarUrl = mediaUrl(other?.avatar) ?? mediaUrl(barber?.cover)
    }

    return {
      id: String(c.id),
      title,
      subtitle,
      avatarUrl,
      otherUserId: otherId,
      lastMessage: c.lastMessage ?? null,
      lastMessageAt: c.lastMessageAt ?? c.createdAt ?? null,
      unreadCount: 0,
    }
  })
}

/**
 * GET /api/chat/conversations
 * The signed-in user's chat threads, newest first, with unread counts.
 *
 * NOTE: lives under /chat/* because /api/messages/* would collide with the
 * REST routes of the `messages` collection.
 */
export const conversationsListEndpoint: PayloadEndpoint = {
  path: '/chat/conversations',
  method: 'get',
  handler: async (req) => {
    const u = req.user
    if (!u) throw new APIError('Unauthorized', 401)

    const { docs } = await req.payload.find({
      collection: 'conversations',
      where: { participants: { contains: u.id } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
      req,
    })

    ;(docs as AnyDoc[]).sort((a, b) => {
      const ta = new Date(a.lastMessageAt || a.createdAt).getTime() || 0
      const tb = new Date(b.lastMessageAt || b.createdAt).getTime() || 0
      return tb - ta
    })

    const ids = docs.map((c: AnyDoc) => String(c.id))
    const unreadRes = ids.length
      ? await req.payload.find({
          collection: 'messages',
          where: {
            and: [
              { conversation: { in: ids } },
              { sender: { not_equals: u.id } },
              { readAt: { exists: false } },
            ],
          },
          depth: 0,
          pagination: false,
          overrideAccess: true,
          req,
        })
      : null

    const unread: Record<string, number> = {}
    for (const m of (unreadRes?.docs ?? []) as AnyDoc[]) {
      const cid = relId(m.conversation)
      if (cid) unread[cid] = (unread[cid] ?? 0) + 1
    }

    const items = await serializeConversations(req.payload, docs as AnyDoc[], String(u.id), u.role)
    return Response.json({
      docs: items.map((it) => ({ ...it, unreadCount: unread[it.id] ?? 0 })),
    })
  },
}

/**
 * POST /api/chat/conversations
 * Find-or-create a 1:1 thread. Customers start threads from a barber profile
 * (`barberId`); barbers can reach a customer directly (`userId`). Returns the
 * serialized conversation either way.
 */
export const conversationCreateEndpoint: PayloadEndpoint = {
  path: '/chat/conversations',
  method: 'post',
  handler: async (req) => {
    const u = req.user
    if (!u) throw new APIError('Unauthorized', 401)
    const body = (await req.json?.()) ?? {}
    const barberId = body?.barberId ? String(body.barberId) : null
    const targetUserId = body?.userId ? String(body.userId) : null
    if (!barberId && !targetUserId) {
      throw new APIError('مقصد گفتگو مشخص نشده است.', 400)
    }

    let barberDoc: AnyDoc | null = null
    let targetUser: AnyDoc | null = null

    if (barberId) {
      barberDoc = await req.payload
        .findByID({ collection: 'barbers', id: barberId, depth: 0, overrideAccess: true, req })
        .catch(() => null)
      if (!barberDoc) throw new APIError('آرایشگر پیدا نشد.', 404)
      const barberUserId = relId(barberDoc.user)
      if (!barberUserId) throw new APIError('این آرایشگر حساب کاربری فعال ندارد.', 400)
      targetUser = await req.payload
        .findByID({ collection: 'users', id: barberUserId, depth: 0, overrideAccess: true, req })
        .catch(() => null)
    } else {
      targetUser = await req.payload
        .findByID({ collection: 'users', id: targetUserId!, depth: 0, overrideAccess: true, req })
        .catch(() => null)
      if (targetUser?.role === ROLES.BARBER) {
        const { docs } = await req.payload.find({
          collection: 'barbers',
          where: { user: { equals: String(targetUser.id) } },
          depth: 0,
          limit: 1,
          pagination: false,
          overrideAccess: true,
          req,
        })
        barberDoc = (docs[0] as AnyDoc) ?? null
      }
    }

    if (!targetUser) throw new APIError('کاربر مقصد پیدا نشد.', 404)
    const targetId = String(targetUser.id)
    if (targetId === String(u.id)) throw new APIError('گفتگو با خودشان ممکن نیست.', 400)

    if (u.role !== ROLES.ADMIN) {
      const allowed =
        (u.role === ROLES.CUSTOMER && targetUser.role === ROLES.BARBER) ||
        (u.role === ROLES.BARBER && targetUser.role === ROLES.CUSTOMER)
      if (!allowed) throw new APIError('این گفتگو مجاز نیست.', 403)
    }

    const where: Where = {
      and: [
        { participants: { contains: u.id } },
        { participants: { contains: targetId } },
      ],
    }
    const { docs: existing } = await req.payload.find({
      collection: 'conversations',
      where,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
    })

    let convo = existing[0] as AnyDoc | undefined
    let created = false
    if (!convo) {
      created = true
      convo = (await req.payload.create({
        collection: 'conversations',
        data: {
          participants: [String(u.id), targetId],
          ...(barberId ? { barber: barberId } : {}),
        },
        depth: 0,
        overrideAccess: true,
        req,
      })) as AnyDoc
    } else if (barberId && !convo.barber) {
      convo = (await req.payload.update({
        collection: 'conversations',
        id: String(convo.id),
        data: { barber: barberId },
        depth: 0,
        overrideAccess: true,
        req,
      })) as AnyDoc
    }

    const [item] = await serializeConversations(req.payload, [convo], String(u.id), u.role)
    return Response.json({ ...item, created })
  },
}

export { MAX_MESSAGE_LENGTH }
