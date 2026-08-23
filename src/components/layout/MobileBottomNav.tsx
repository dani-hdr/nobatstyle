'use client'

import { CalendarCheck, Home, Scissors, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'

const items = [
  { href: '/', label: 'خانه', Icon: Home },
  { href: '/barbers', label: 'آرایشگرها', Icon: Scissors },
  { href: '/services', label: 'خدمات', Icon: Sparkles },
  { href: '/dashboard', label: 'نوبت‌های من', Icon: CalendarCheck },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href))

  return (
    <nav
      aria-label="ناوبری پایین"
      className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-[64px] w-full max-w-[1280px] items-stretch">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 pt-1 text-[11px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-7 items-center justify-center px-3 transition-colors',
                  
                )}
              >
                <Icon className={cn('size-5.5', active && 'scale-[1.05]')} />
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
