'use client'

import { Headphones, Info, Menu, UserRound } from 'lucide-react'
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
import { navItems } from './nav-items'

const supportItems = [
  { href: '/support', label: 'پشتیبانی', Icon: Headphones },
  { href: '/about', label: 'درباره ما', Icon: Info },
]

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

export function MobileMenu() {
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
              {navItems.map((item) => (
                <li key={item.href}>
                  <SheetLink href={item.href}>{item.label}</SheetLink>
                </li>
              ))}
            </ul>
          </nav>

          <Separator />

          <section>
            <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">حساب کاربری</div>
            <Link href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                <UserRound className="size-4" />
                ورود / ثبت‌نام
              </Button>
            </Link>
          </section>

          <Separator />

          <nav aria-label="پشتیبانی">
            <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">پشتیبانی</div>
            <ul className="flex flex-col">
              {supportItems.map(({ href, label, Icon }) => (
                <li key={href}>
                  <SheetLink href={href}>
                    <Icon className="text-muted-foreground size-5" />
                    {label}
                  </SheetLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
