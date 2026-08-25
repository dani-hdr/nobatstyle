import { Search } from 'lucide-react'

import { BarberSearch } from '@/components/home/BarberSearch'
import { Button } from '@/components/ui/button'
import type { ProvinceGroup } from '@/lib/barber-search'
import type { Viewer } from '@/lib/viewer.server'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from './nav-items'

export function MobileHeader({
  siteName,
  logo,
  items,
  cities,
  user,
}: {
  siteName?: string
  logo?: { url?: string | null; alt?: string | null } | null
  items?: NavItem[]
  cities: ProvinceGroup[]
  user?: Viewer | null
}) {
  return (
    <div className="flex w-full h-16 items-center justify-between md:hidden">
      <Logo siteName={siteName} logo={logo} />
      <div className="flex items-center gap-0.5">
        <BarberSearch
          cities={cities}
          trigger={
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="جستجو">
              <Search className="size-5" />
            </Button>
          }
        />
        <MobileMenu items={items} user={user} />
      </div>
    </div>
  )
}
