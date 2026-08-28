import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { BarberDashboard } from '@/components/dashboard/BarberDashboard'
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard'
import { Container } from '@/components/layout/Container'
import { isProfileComplete } from '@/lib/profile-completion.server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { ROLES } from '@/utils/constants'
import type { User } from '@/payload-types'

export const metadata = { title: 'داشبورد' }

export default async function DashboardPage() {
  const payload = await getPayload({ config })

  let authUser: { id: string | number } | null = null
  try {
    const res = await payload.auth({ headers: await headers() })
    authUser = res.user ? { id: res.user.id } : null
  } catch {
    // No request context — treat as signed out.
  }

  if (!authUser) redirect('/login')

  // Re-read the profile so role/name always come from the DB, not the token.
  const me = (await payload.findByID({
    collection: 'users',
    id: String(authUser.id),
    depth: 0,
    overrideAccess: true,
  })) as User

  if (me.role === ROLES.ADMIN) redirect('/admin')

  // Incomplete accounts must finish their profile before entering the dashboard.
  if (!(await isProfileComplete(payload, me))) redirect('/profile')

  return (
    <Container className="py-8 md:py-12">
      {me.role === ROLES.BARBER ? (
        <BarberDashboard userName={me.name ?? undefined} />
      ) : (
        <CustomerDashboard userName={me.name ?? undefined} />
      )}
    </Container>
  )
}
