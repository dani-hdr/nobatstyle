import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

const MAX_MESSAGE_LENGTH = 2000

function participantIds(convo: { participants?: (string | number | { id?: string | number })[] }) {
  return (convo.participants || []).map((p) =>
    typeof p === 'object' && p && 'id' in p ? p.id : p,
  )
}

/**
 * A chat thread between a customer and a barber. Participants are users; a
 * customer has exactly one conversation per barber (enforced in a beforeChange
 * hook).
 */
export const Conversations: CollectionConfig = {
  slug: 'conversations',
  labels: {
    singular: 'گفتگو',
    plural: 'گفتگوها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'ارتباطات',
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
      // ever sees messages from their own conversations. Fetching also marks the
      // other party's messages as read (read receipts).
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
          req,
        })

        if (!participantIds(convo).includes(u.id)) {
          throw new APIError('Forbidden', 403)
        }

        const res = await req.payload.find({
          collection: 'messages',
          depth: 1,
          where: { conversation: { equals: id } },
          sort: 'createdAt',
          limit: 200,
          overrideAccess: true,
          req,
        })

        const unread = res.docs.filter(
          (m) => String(m.sender && typeof m.sender === 'object' ? m.sender.id : m.sender) !== String(u.id) && !m.readAt,
        )
        await Promise.all(
          unread.map((m) =>
            req.payload.update({
              collection: 'messages',
              id: m.id,
              data: { readAt: new Date().toISOString() },
              overrideAccess: true,
              req,
            }),
          ),
        )

        return Response.json(res)
      },
    },
    {
      // POST /api/conversations/:id/messages — send a message as the signed-in
      // participant. The Messages afterChange hook keeps conversation ordering
      // (lastMessage/lastMessageAt) fresh.
      path: '/:id/messages',
      method: 'post',
      handler: async (req) => {
        const u = req.user
        if (!u) throw new APIError('Unauthorized', 401)
        const id = String(req.routeParams?.['id'])

        const convo = await req.payload.findByID({
          collection: 'conversations',
          id,
          depth: 0,
          overrideAccess: false,
          req,
        })
        if (!participantIds(convo).includes(u.id)) {
          throw new APIError('Forbidden', 403)
        }

        const body = (await req.json?.()) ?? {}
        const content = String(body?.content ?? '').trim()
        if (!content) throw new APIError('متن پیام خالی است.', 400)
        if (content.length > MAX_MESSAGE_LENGTH) {
          throw new APIError('پیام بیش از حد مجاز طولانی است.', 400)
        }

        const doc = await req.payload.create({
          collection: 'messages',
          data: { conversation: id, sender: u.id, content },
          depth: 1,
          overrideAccess: true,
          req,
        })
        return Response.json(doc)
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
      label: 'شرکت‌کنندگان',
    },
    {
      name: 'barber',
      type: 'relationship',
      relationTo: 'barbers',
      label: 'آرایشگر',
    },
    {
      name: 'lastMessage',
      type: 'text',
      label: 'آخرین پیام',
      admin: { readOnly: true },
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      label: 'زمان آخرین پیام',
      admin: {
        readOnly: true,
        position: 'sidebar',
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
  ],
}
