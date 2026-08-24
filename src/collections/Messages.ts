import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: {
    singular: 'پیام',
    plural: 'پیام‌ها',
  },
  admin: {
    useAsTitle: 'id',
    group: 'ارتباطات',
  },
  access: {
    // Messages are exposed through the participant-scoped conversation endpoint
    // (/api/conversations/:id/messages) so raw access stays admin-only and we
    // can't leak between customers via a naive row-level query.
    read: ({ req }) => isAdmin({ req }),
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      return u.role === ROLES.CUSTOMER || u.role === ROLES.BARBER || isAdmin({ req })
    },
    update: ({ req }) => Boolean(req.user), // allow marking read, idempotent
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      // Touch the parent conversation so list ordering reflects newest message.
      // `doc.conversation` may arrive populated (depth > 0) or as an id.
      async ({ operation, req, doc }) => {
        if (operation === 'create' && doc.conversation) {
          const raw = doc.conversation as string | { id?: string }
          const conversationId =
            typeof raw === 'object' && raw !== null && 'id' in raw ? String(raw.id) : String(raw)
          await req.payload.update({
            collection: 'conversations',
            id: conversationId,
            data: { lastMessage: doc.content || '', lastMessageAt: new Date().toISOString() },
            req,
            overrideAccess: true,
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversations',
      required: true,
      index: true,
      label: 'گفتگو',
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'فرستنده',
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'متن پیام',
    },
    {
      name: 'readAt',
      type: 'date',
      label: 'زمان مطالعه',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/fields/PersianDateField#PersianDateTimeField',
        },
      },
    },
  ],
}
