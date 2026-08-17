import type { Home } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type HomeContent = {
  hero: Home['hero']
  stats: Home['stats']
  whyUs: Home['whyUs']
  popularServices: Home['popularServices']
}

/**
 * Loads the content for the homepage (hero, stats, why-us, popular services)
 * from the `home` global. Uses depth 1 so relationships/media are populated.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const payload = await getPayload({ config })

  const home = await payload.findGlobal({
    slug: 'home',
    depth: 1,
  })

  const hero = home.hero
  const stats = home.stats
  const whyUs = home.whyUs

  // Only show active catalog services.
  const popularServices = (home.popularServices ?? []).filter((service) => {
    if (typeof service === 'string') return true
    return service.isActive !== false
  })

  return {
    hero,
    stats,
    whyUs,
    popularServices,
  }
}
