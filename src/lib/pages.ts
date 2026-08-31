import type { Page } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Resolves a single published page by slug for the dynamic public route.
 * Only `published` pages are ever returned to visitors.
 */
export async function getPublishedPageBySlug(slug: string): Promise<Page | null> {
  const payload = await getPayload({ config })

  const res = await payload.find({
    collection: 'pages',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    depth: 1,
    limit: 1,
    pagination: false,
  })

  return (res.docs[0] as Page) ?? null
}
