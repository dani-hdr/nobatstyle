import type { Media } from '@/payload-types'
import { DEFAULT_NAV_ITEMS, type NavItem } from '@/components/layout/nav-items'
import config from '@payload-config'
import { getPayload } from 'payload'

export type SiteInfo = {
  siteName: string
  logo: Pick<Media, 'url' | 'alt'> | null
  navLinks: NavItem[]
}

/**
 * Loads platform-wide site info (site name, logo, top nav links) from the
 * Settings global for the global frontend layout. Falls back to sane defaults
 * when the fields are not configured yet.
 */
export async function getSiteInfo(): Promise<SiteInfo> {
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'settings',
    depth: 1,
  })

  const logoCandidate = settings.general?.logo
  const logo = logoCandidate && typeof logoCandidate === 'object' ? logoCandidate : null

  const payloadLinks =
    settings.navigation?.links
      ?.filter((link) => link.label && link.href)
      .map((link) => ({ label: link.label, href: link.href })) ?? []

  return {
    siteName: settings.general?.siteName || 'نوبت استایل',
    logo,
    navLinks: payloadLinks.length > 0 ? payloadLinks : DEFAULT_NAV_ITEMS,
  }
}
