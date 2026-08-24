import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Media, User } from '@/payload-types'

/** Signed-in identity for shell chrome (header/menus). Null when signed out. */
export type Viewer = {
  id: string
  name?: string | null
  username: string
  role: 'customer' | 'barber' | 'admin'
  avatarUrl?: string | null
}

/**
 * Resolves the signed-in user from request cookies. Safe to call from any
 * server component — returns null when there is no request context or no
 * valid session (e.g. prerendering).
 */
export async function getViewer(): Promise<Viewer | null> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return null

    // Re-read so name/avatar always come from the DB, not token claims.
    const me = (await payload.findByID({
      collection: 'users',
      id: String(user.id),
      depth: 1,
      overrideAccess: true,
    })) as User
    if (typeof me !== 'object' || !me?.id) return null

    const avatar = me.avatar && typeof me.avatar === 'object' ? (me.avatar as Media) : null
    return {
      id: String(me.id),
      name: me.name ?? null,
      username: me.username,
      role: me.role,
      avatarUrl: avatar?.url ?? null,
    }
  } catch {
    return null
  }
}
