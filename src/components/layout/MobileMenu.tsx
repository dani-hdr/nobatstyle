'use client'

import { LogOut, Menu, UserRound } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Viewer } from '@/lib/viewer.server'
import { DEFAULT_NAV_ITEMS, type NavItem } from './nav-items'
import { ViewerAvatar, displayName, useLogout, viewerMenuItems } from './UserMenu'



function AccountSection({ viewer }: { viewer: Viewer }) {
  const { logout, pending } = useLogout()

  return (
    <div className="space-y-2">
      <div className="border-border bg-muted/50 flex items-center gap-3 rounded-xl border p-3">
        <ViewerAvatar viewer={viewer} className="size-11" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName(viewer)}</p>
          <p dir="ltr" className="text-muted-foreground truncate text-xs">
            {viewer.username}
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        {viewerMenuItems(viewer).map(({ href, label, Icon }) => (
          <li key={href}>
            <SheetLink href={href}>
              <Icon className="text-muted-foreground size-5" />
              {label}
            </SheetLink>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void logout()}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium transition-colors disabled:opacity-50"
      >
        <LogOut className="size-5" />
        خروج از حساب
      </button>
    </div>
  )
}

function SheetLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className="hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors"
      >
        {children}
      </Link>
    </SheetClose>
  )
}

export function MobileMenu({
  items = DEFAULT_NAV_ITEMS,
  user,
}: {
  items?: NavItem[]
  user?: Viewer | null
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-me-1 rounded-full"
          aria-label="باز کردن منو"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="px-0">
        <SheetHeader>
          <SheetTitle className="px-4 pb-1 text-start text-base">منو</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
          <nav aria-label="ناوبری">
            <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">ناوبری</div>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <SheetLink href={item.href}>{item.label}</SheetLink>
                </li>
              ))}
            </ul>
          </nav>

          <Separator />

          <section>
            <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">حساب کاربری</div>
            {user ? (
              <AccountSection viewer={user} />
            ) : (
              <Link href="/login" className="block">
                <Button className="w-full" size="lg">
                  <UserRound className="size-4" />
                  ورود / ثبت‌نام
                </Button>
              </Link>
            )}
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
