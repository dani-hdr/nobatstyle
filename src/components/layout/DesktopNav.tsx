'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'
import { DEFAULT_NAV_ITEMS, type NavItem } from './nav-items'

export function DesktopNav({ items = DEFAULT_NAV_ITEMS }: { items?: NavItem[] }) {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href))

  return (
    <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
