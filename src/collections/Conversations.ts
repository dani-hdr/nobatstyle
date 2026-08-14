import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

/**
 * A chat thread between a customer and a barber. Participants are users; a
 * customer has exactly one conversation per barber (enforced in a beforeChange
 * hook).
 */
export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'id',
    group: 'پیام‌ها',
  },
  access: {
    read: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { participants: { contains: u.id } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { participants: { contains: u.id } }
    },
    delete: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      return { participants: { contains: u.id } }
    },
  },
  endpoints: [
    {
      // GET /api/conversations/:id/messages — participant-scoped, so a user only
      // ever sees messages from their own conversations.
      path: '/:id/messages',
      method: 'get',
      handler: async (req) => {
        const u = req.user
        if (!u) throw new APIError('Unauthorized', 401)
        const id = String(req.routeParams?.['id'])

        const convo = await req.payload.findByID({
          collection: 'conversations',
          id,
          depth: 0,
          overrideAccess: false,
        })

        const participants = (convo?.participants || []).map((p) =>
          typeof p === 'object' && p && 'id' in p ? p.id : p,
        )
        if (!participants.includes(u.id)) {
          throw new APIError('Forbidden', 403)
        }

        const res = await req.payload.find({
          collection: 'messages',
          depth: 1,
          where: { conversation: { equals: id } },
          sort: 'createdAt',
          limit: 200,
          overrideAccess: true,
        })
        return Response.json(res)
      },
    },
  ],
  fields: [
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: true,
      maxRows: 2,
    },
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
    },
    {
      name: 'lastMessage',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
