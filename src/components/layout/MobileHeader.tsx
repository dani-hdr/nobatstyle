import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from './nav-items'
import { SearchDialog } from './SearchDialog'

export function MobileHeader({
  siteName,
  logo,
  items,
}: {
  siteName?: string
  logo?: { url?: string | null; alt?: string | null } | null
  items?: NavItem[]
}) {
  return (
    <div className="flex w-full h-16 items-center justify-between md:hidden">
      <Logo siteName={siteName} logo={logo} />
      <div className="flex items-center gap-0.5">
        <SearchDialog
          trigger={
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="جستجو">
              <Search className="size-5" />
            </Button>
          }
        />
        <MobileMenu items={items} />
      </div>
    </div>
  )
}
