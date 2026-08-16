import { AtSign, Camera, Globe, Send } from 'lucide-react'
import Link from 'next/link'

import type { NavItem } from './nav-items'
import { DEFAULT_NAV_ITEMS } from './nav-items'
import { Container } from './Container'

const fallbackQuickLinks: NavItem[] = DEFAULT_NAV_ITEMS

const supportLinks = [
  { href: '/faq', label: 'سوالات متداول' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/rules', label: 'قوانین' },
  { href: '/privacy', label: 'حریم خصوصی' },
]

const professionalLinks = [
  { href: '/barber-register', label: 'ثبت‌نام آرایشگر' },
  { href: '/barber-login', label: 'ورود آرایشگر' },
]

const socialLinks = [
  { href: '/', label: 'اینستاگرام', Icon: Camera },
  { href: '/', label: 'توییتر', Icon: Send },
  { href: '/', label: 'یوتیوب', Icon: Globe },
  { href: '/', label: 'تلگرام', Icon: AtSign },
]

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
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
  quickLinks = fallbackQuickLinks,
}: {
  siteName?: string
  quickLinks?: NavItem[]
}) {
  return (
    <footer className="mt-auto border-t">
      <Container className="pt-14 pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4 lg:ps-1">
            <p className="text-lg font-bold">{siteName}</p>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-6">
              آرایشگر مورد علاقت رو پیدا کن و به‌سادگی نوبت بگیر.
            </p>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <LinkColumn title="دسترسی سریع" links={quickLinks} />
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <LinkColumn title="پشتیبانی" links={supportLinks} />
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <LinkColumn title="برای آرایشگران" links={professionalLinks} />
          </div>
        </div>

        <div className="border-t mt-12 flex flex-col items-center justify-between gap-4 border-border pt-6 sm:flex-row">
          <p className="text-muted-foreground text-sm" dir="rtl">
            © ۱۴۰۵ نوبت استایل
          </p>
          <ul className="flex items-center gap-1">
            {socialLinks.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-full transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
