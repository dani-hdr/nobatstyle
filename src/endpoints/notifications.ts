import type { Endpoint as PayloadEndpoint } from 'payload'
import { APIError } from 'payload'

/**
 * GET /api/notifications/overview
 * Compact payload for the header notification bell: the latest notifications
 * plus the count of still-unread ones. Only the signed-in user's own
 * notifications are returned (enforced by the collection's read access).
 */
export const notificationsOverviewEndpoint: PayloadEndpoint = {
  path: '/overview',
  method: 'get',
  handler: async (req) => {
    if (!req.user) throw new APIError('Unauthorized', 401)

    const { docs, totalDocs } = await req.payload.find({
      collection: 'notifications',
      depth: 0,
      where: { user: { equals: String(req.user.id) } },
      sort: '-createdAt',
      limit: 8,
      overrideAccess: false,
      req,
    })

    const unreadRes = await req.payload.find({
      collection: 'notifications',
      depth: 0,
      where: {
        and: [{ user: { equals: String(req.user.id) } }, { readAt: { exists: false } }],
      },
      limit: 1,
      pagination: false,
      overrideAccess: false,
      req,
    })

    return Response.json({ docs, totalDocs, unreadCount: unreadRes.totalDocs ?? 0 })
  },
}

/**
 * POST /api/notifications/read-all
 * Marks every unread notification of the signed-in user as read.
 */
export const notificationsReadAllEndpoint: PayloadEndpoint = {
  path: '/read-all',
  method: 'post',
  handler: async (req) => {
    if (!req.user) throw new APIError('Unauthorized', 401)

    const unreadRes = await req.payload.find({
      collection: 'notifications',
      depth: 0,
      where: {
        and: [{ user: { equals: String(req.user.id) } }, { readAt: { exists: false } }],
      },
      limit: 1000,
      pagination: false,
      overrideAccess: false,
      req,
    })

    const now = new Date().toISOString()
    await Promise.all(
      unreadRes.docs.map((n) =>
        req.payload.update({
          collection: 'notifications',
          id: String(n.id),
          data: { readAt: now },
          overrideAccess: true,
          req,
        }),
      ),
    )

    return Response.json({ ok: true, updated: unreadRes.docs.length })
  },
}
