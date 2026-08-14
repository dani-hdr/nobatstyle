import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    useAsTitle: 'id',
    group: 'پیام‌ها',
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
      async ({ operation, req, doc }) => {
        if (operation === 'create' && doc.conversation) {
          await req.payload.update({
            collection: 'conversations',
            id: doc.conversation as string,
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
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'readAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
