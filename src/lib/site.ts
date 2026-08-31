import { DEFAULT_NAV_ITEMS, type NavItem } from '@/components/layout/nav-items'
import type { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type SiteInfo = {
  siteName: string
  logo: Pick<Media, 'url' | 'alt'> | null
  navLinks: NavItem[]
}

export type FooterLink = { label: string; href: string }

export type FooterColumn = {
  id?: string
  title: string
  links: FooterLink[]
}

export type FooterSocial = {
  id?: string
  icon: 'instagram' | 'telegram' | 'twitter' | 'youtube'  | 'whatsapp'
  label?: string | null
  href: string
}

export type FooterContent = {
  aboutText?: string | null
  columns: FooterColumn[]
  socialLinks: FooterSocial[]
  copyright?: string | null
}

/** Static fallbacks used until an admin configures the Footer global. */
export const DEFAULT_FOOTER: FooterContent = {
  aboutText: 'آرایشگر مورد علاقه‌ت رو پیدا کن و به‌سادگی نوبت بگیر.',
  columns: [
    {
      title: 'دسترسی سریع',
      links: DEFAULT_NAV_ITEMS,
    },
    {
      title: 'پشتیبانی',
      links: [
        { href: '/faq', label: 'سوالات متداول' },
        { href: '/contact', label: 'تماس با ما' },
        { href: '/rules', label: 'قوانین' },
        { href: '/privacy', label: 'حریم خصوصی' },
      ],
    },
    {
      title: 'برای آرایشگران',
      links: [
        { href: '/barber-register', label: 'ثبت‌نام آرایشگر' },
        { href: '/barber-login', label: 'ورود آرایشگر' },
      ],
    },
  ],
  socialLinks: [
    { icon: 'instagram', label: 'اینستاگرام', href: '/' },
    { icon: 'twitter', label: 'توییتر', href: '/' },
    { icon: 'youtube', label: 'یوتیوب', href: '/' },
    { icon: 'telegram', label: 'تلگرام', href: '/' },
  ],
  copyright: '© ۱۴۰۵ نوبت استایل',
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

/**
 * Loads the Footer global content for the frontend layout. Missing/empty
 * sections fall back to the static default so the footer never looks broken
 * before an admin configures it.
 */
export async function getFooterContent(siteName?: string): Promise<FooterContent> {
  const payload = await getPayload({ config })

  const footer = await payload
    .findGlobal({ slug: 'footer', depth: 0 })
    .catch(() => null)

  const columns: FooterColumn[] = ((footer?.columns ?? []) as FooterColumn[])
    .filter((c) => c.title && Array.isArray(c.links) && c.links.length > 0)
    .map((c) => ({
      id: c.id,
      title: c.title,
      links: c.links.filter((l) => l.label && l.href),
    }))

  const socialLinks: FooterSocial[] = ((footer?.socialLinks ?? []) as FooterSocial[])
    .filter((s) => s.href && s.icon)
    .map((s) => ({ id: s.id, icon: s.icon, label: s.label, href: s.href }))

  return {
    aboutText: footer?.brand?.aboutText ?? DEFAULT_FOOTER.aboutText,
    columns: columns.length > 0 ? columns : DEFAULT_FOOTER.columns,
    socialLinks: socialLinks.length > 0 ? socialLinks : DEFAULT_FOOTER.socialLinks,
    copyright: footer?.copyright ?? (siteName ? `© ۱۴۰۵ ${siteName}` : DEFAULT_FOOTER.copyright),
  }
}
