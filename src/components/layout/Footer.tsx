import { AtSign, Camera, Globe, MessageCircle, Send, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import type { FooterColumn, FooterContent, FooterSocial } from '@/lib/site'
import { DEFAULT_FOOTER } from '@/lib/site'

import { Container } from './Container'

const SOCIAL_ICONS: Record<FooterSocial['icon'], LucideIcon> = {
  instagram: Camera,
  telegram: Send,
  twitter: AtSign,
  youtube: Globe,
  whatsapp: MessageCircle,
}

function LinkColumn({ title, links }: FooterColumn) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer({
  siteName = 'نوبت استایل',
  content = DEFAULT_FOOTER,
}: {
  siteName?: string
  content?: FooterContent
}) {
  const { aboutText, columns, socialLinks, copyright } = content

  return (
    <footer className="mt-auto border-t">
      <Container className="pt-14 pb-20 md:pb-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-12">
          <div className="col-span-full lg:col-span-4 lg:ps-1">
            <p className="text-lg font-bold">{siteName}</p>
            {aboutText && (
              <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-6">{aboutText}</p>
            )}
          </div>

          {columns.slice(0, 3).map((column) => (
            <div className="lg:col-span-2" key={column.id ?? column.title}>
              <LinkColumn title={column.title} links={column.links} />
            </div>
          ))}
        </div>

        <div className="border-t mt-12 flex flex-col items-center justify-between gap-4 border-border pt-6 sm:flex-row">
          <p className="text-muted-foreground text-sm" dir="rtl">
            {copyright ?? `© ۱۴۰۵ ${siteName}`}
          </p>
          {socialLinks.length > 0 && (
            <ul className="flex items-center gap-1">
              {socialLinks.map(({ href, label, icon }) => {
                const Icon = SOCIAL_ICONS[icon] ?? Globe
                return (
                  <li key={`${icon}-${href}`}>
                    <a
                      href={href}
                      aria-label={label || icon}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-full transition-colors"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Container>
    </footer>
  )
}
