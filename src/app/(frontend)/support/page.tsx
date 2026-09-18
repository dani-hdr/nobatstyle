import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'

import { TicketApp } from '@/components/support/TicketApp'
import type { User } from '@/payload-types'

export const metadata: Metadata = { title: 'پشتیبانی' }

export default async function SupportPage() {
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
    depth: 0,
    overrideAccess: true,
  })) as User

  return (
    <TicketApp
      me={{
        id: String(me.id),
        name: me.name ?? null,
        username: me.username,
        role: me.role,
      }}
    />
  )
}
