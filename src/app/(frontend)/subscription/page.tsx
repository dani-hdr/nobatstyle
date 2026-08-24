import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Container } from '@/components/layout/Container'
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'
import { getViewer } from '@/lib/viewer.server'
import { ROLES } from '@/utils/constants'

export const metadata: Metadata = { title: 'اشتراک' }

export default async function SubscriptionPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  if (viewer.role === ROLES.CUSTOMER) redirect('/dashboard')
  if (viewer.role === ROLES.ADMIN) redirect('/admin')

  return (
    <Container className="py-8 md:py-12">
      <SubscriptionManager />
    </Container>
  )
}
