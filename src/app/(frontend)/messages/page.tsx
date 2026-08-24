import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'

import { ChatApp } from '@/components/messages/ChatApp'
import type { Media, User } from '@/payload-types'
import { ROLES } from '@/utils/constants'

export const metadata: Metadata = { title: 'پیام‌ها' }

export default async function MessagesPage() {
  const payload = await getPayload({ config })

  let authUserId: string | null = null
  try {
    const res = await payload.auth({ headers: await headers() })
    authUserId = res.user ? String(res.user.id) : null
  } catch {
    // No request context — treat as signed out.
  }

  if (!authUserId) redirect('/login')

  const me = (await payload.findByID({
    collection: 'users',
    id: authUserId,
    depth: 1,
    overrideAccess: true,
  })) as User

  if (me.role === ROLES.ADMIN) redirect('/admin')

  const avatar = me.avatar && typeof me.avatar === 'object' ? (me.avatar as Media) : null

  return (
    <ChatApp
      me={{
        id: String(me.id),
        name: me.name,
        username: me.username,
        avatarUrl: avatar?.url ?? null,
      }}
    />
  )
}
