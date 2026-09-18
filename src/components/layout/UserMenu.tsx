'use client'

import { CalendarCheck, LifeBuoy, LogOut, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Viewer } from '@/lib/viewer.server'
import { cn } from '@/utils/cn'

export function ViewerAvatar({ viewer, className }: { viewer: Viewer; className?: string }) {
  return (
    <Avatar className={cn('border-input border', className)}>
      {viewer.avatarUrl ? <AvatarImage src={viewer.avatarUrl} alt={displayName(viewer)} /> : null}
      <AvatarFallback>{displayName(viewer).slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}

export function displayName(viewer: Viewer): string {
  return viewer.name || viewer.username || 'کاربر'
}

/** Shared menu entries so desktop popover and mobile sheet stay in sync. */
export function viewerMenuItems(viewer: Viewer) {
  const items: { href: string; label: string; Icon: typeof UserRound }[] = [
    viewer.role === 'admin'
      ? { href: '/admin', label: 'پنل مدیریت', Icon: ShieldCheck }
      : { href: '/dashboard', label: 'نوبت‌های من', Icon: CalendarCheck },
  ]
  if (viewer.role !== 'admin') {
    items.push({ href: '/messages', label: 'پیام‌ها', Icon: MessageCircle })
  }
  items.push({ href: '/support', label: 'پشتیبانی', Icon: LifeBuoy })
  items.push({ href: '/profile', label: 'پروفایل', Icon: UserRound })
  return items
}

export function useLogout(onDone?: () => void) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const logout = async () => {
    if (pending) return
    setPending(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {
      // Even on network failure, continue to the signed-out state.
    }
    onDone?.()
    router.push('/')
    router.refresh()
    setPending(false)
  }

  return { logout, pending }
}

export function UserMenu({ viewer }: { viewer: Viewer }) {
  const [open, setOpen] = useState(false)
  const { logout, pending } = useLogout(() => setOpen(false))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          aria-label="منوی حساب کاربری"
          className="h-9 rounded-full ps-1 pe-2 lg:ps-1.5 lg:pe-3"
        >
          <ViewerAvatar viewer={viewer} className="size-7 hidden md:block" />
          <span className="hidden max-w-28 truncate text-sm font-medium lg:inline">
            {displayName(viewer)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-1 p-1.5">
        <div className="border-b px-2 pt-1 pb-2.5">
          <p className="truncate text-sm font-semibold">{displayName(viewer)}</p>
          <p dir="ltr" className="text-muted-foreground truncate text-xs">
            {viewer.username}
          </p>
        </div>
        <nav className="flex flex-col">
          {viewerMenuItems(viewer).map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="hover:bg-muted flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors"
            >
              <Icon className="text-muted-foreground size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t pt-1.5">
          <button
            type="button"
            onClick={() => void logout()}
            disabled={pending}
            className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <LogOut className="size-4" />
            خروج از حساب
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
