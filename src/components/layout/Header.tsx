'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { BarberSearch } from '@/components/home/BarberSearch'
import { Button } from '@/components/ui/button'
import type { ProvinceGroup } from '@/lib/barber-search'
import { cn } from '@/utils/cn'
import { Container } from './Container'
import { DesktopNav } from './DesktopNav'
import { Logo } from './Logo'
import { MobileHeader } from './MobileHeader'
import type { NavItem } from './nav-items'

type HeaderImage = { url?: string | null; alt?: string | null } | null

export function Header({
  siteName,
  logo,
  items,
  cities,
}: {
  siteName?: string
  logo?: HeaderImage
  items?: NavItem[]
  cities: ProvinceGroup[]
}) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'bg-background/80 sticky top-0 z-40 backdrop-blur transition-all duration-200',
        scrolled ? 'border-b' : 'border-b border-transparent',
      )}
    >
      <div className={cn('transition-all', scrolled ? 'md:h-14' : 'md:h-16')}>
        <Container className="flex h-16 items-center justify-between md:h-full">
          <div className="hidden md:block">
            <Logo siteName={siteName} logo={logo} />
          </div>

          <DesktopNav items={items} />

          <div className="flex items-center gap-2">
            <BarberSearch
              cities={cities}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden rounded-full md:inline-flex"
                  aria-label="جستجو"
                >
                  <Search className="size-5" />
                </Button>
              }
            />
            <Link href="/login" className="hidden md:block">
              <Button size="sm" className="h-9 rounded-full px-5">
                ورود / ثبت‌نام
              </Button>
            </Link>
          </div>

          <MobileHeader siteName={siteName} logo={logo} items={items} cities={cities} />
        </Container>
      </div>
    </header>
  )
}
