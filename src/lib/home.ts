import type { Home, Service } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type HomeContent = {
  hero: Home['hero']
  stats: Home['stats']
  whyUs: Home['whyUs']
  services: Service[]
}

/**
 * Loads the content for the homepage (hero, stats, why-us) from the `home`
 * global plus every active service from the catalog. Uses depth 1 so
 * relationships/media are populated.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const payload = await getPayload({ config })

  const [home, servicesRes] = await Promise.all([
    payload.findGlobal({
      slug: 'home',
      depth: 1,
    }),
    payload.find({
      collection: 'services',
      depth: 1,
      where: { isActive: { equals: true } },
      sort: 'name',
      limit: 100,
    }),
  ])

  return {
    hero: home.hero,
    stats: home.stats,
    whyUs: home.whyUs,
    services: servicesRes.docs,
  }
}
