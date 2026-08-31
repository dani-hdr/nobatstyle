'use client'

import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { DashNotification } from '@/lib/dashboard-types'
import { faDate } from '@/lib/dashboard-types'
import { cn } from '@/utils/cn'

type Overview = {
  docs: DashNotification[]
  totalDocs: number
  unreadCount: number
}

function targetHref(n: DashNotification): string {
  const data = (n as unknown as { data?: { link?: string } }).data
  if (data?.link) return data.link
  if (n.type === 'message') return '/messages'
  if (n.type === 'subscription') return '/subscription'
  return '/dashboard'
}

/**
 * Bell in the header showing the signed-in user's notifications with an
 * unread badge. Opens a popover on desktop and a bottom-sheet modal on mobile
 * (per the project's ResponsiveModal convention). Clicking an unread row marks
 * it read and navigates to the relevant page.
 */
export function NotificationBell() {
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [readingAll, setReadingAll] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const fetchedRef = useRef(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/overview', { cache: 'no-store' })
      if (res.ok) {
        const json = (await res.json()) as Overview
        setData(json)
        fetchedRef.current = true
      }
    } catch {
      // Ignore — the header stays usable without the bell data.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Close the desktop dropdown on outside click / Escape.
  useEffect(() => {
    if (!open || isDesktop !== true) return
    const onPointerDown = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, isDesktop])

  const markRead = useCallback(async (n: DashNotification) => {
    if (n.readAt) return
    setMarkingId(n.id)
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAt: new Date().toISOString() }),
      })
      setData((prev) =>
        prev
          ? {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            docs: prev.docs.map((d) =>
              d.id === n.id ? { ...d, readAt: new Date().toISOString() } : d,
            ),
          }
          : prev,
      )
    } catch {
      // Non-fatal.
    } finally {
      setMarkingId(null)
    }
  }, [])

  const openAndRefresh = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) void load(true)
    },
    [load],
  )

  const markAllRead = useCallback(async () => {
    if (readingAll || !data?.unreadCount) return
    setReadingAll(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
              ...prev,
              unreadCount: 0,
              docs: prev.docs.map((d) =>
                d.readAt ? d : { ...d, readAt: new Date().toISOString() },
              ),
            }
            : prev,
        )
      }
    } catch {
      // Non-fatal.
    } finally {
      setReadingAll(false)
    }
  }, [readingAll, data])

  const openNotification = useCallback(
    (n: DashNotification) => {
      void markRead(n)
      setOpen(false)
      router.push(targetHref(n))
    },
    [markRead, router],
  )

  const unread = data?.unreadCount ?? 0

  const panel = (
    <div className="flex max-h-[70dvh] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold">اعلان‌ها</h3>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => void markAllRead()}
            disabled={readingAll}
          >
            {readingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            خواندن همه
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (data?.docs.length ?? 0) === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
            <BellOff className="size-7 opacity-50" />
            اعلان جدیدی ندارید.
          </div>
        ) : (
          <ul>
            {data?.docs.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="hover:bg-muted flex w-full items-start gap-3 px-4 py-3 text-start transition-colors"
                >
                  <span
                    className={cn(
                      'mt-1 flex size-2 shrink-0 rounded-full',
                      n.readAt ? 'bg-muted' : 'bg-primary',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('text-sm', n.readAt ? 'text-muted-foreground' : 'font-semibold')}>
                        {n.title || 'اعلان'}
                      </span>
                      {!n.readAt && <Badge variant="success">جدید</Badge>}
                    </span>
                    {n.body && (
                      <span className="text-muted-foreground mt-0.5 block text-xs leading-5">
                        {n.body}
                      </span>
                    )}
                    <span className="text-muted-foreground mt-1 block text-[11px]">
                      {faDate(n.createdAt)}
                    </span>
                  </span>
                  {markingId === n.id && <Loader2 className="text-muted-foreground mt-1 size-3.5 animate-spin" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalDocs > data.docs.length && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard')
            }}
          >
            مشاهده همه اعلان‌ها
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop dropdown — positioned with plain CSS relative to the bell
          (Radix/floating-ui placed this popover off-screen in this layout). */}
      {isDesktop !== false && (
        <div ref={dropdownRef} className="relative hidden md:block">
          <BellButton
            unread={unread}
            className="rounded-full"
            onClick={() => openAndRefresh(!open)}
          />
          {open && (
            <div className="border-border bg-popover text-popover-foreground  ring-foreground/10 absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border">
              {panel}
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isDesktop === false && (
        <>
          <BellButton
            unread={unread}
            className="rounded-full"
            onClick={() => openAndRefresh(true)}
          />
          <ResponsiveModal open={open} onOpenChange={openAndRefresh}>
            <DialogHeader className="border-b p-4">
              <DialogTitle className="text-base">اعلان‌ها</DialogTitle>
            </DialogHeader>
            {panel}
          </ResponsiveModal>
        </>
      )}
    </>
  )
}

function BellButton({
  unread,
  className,
  onClick,
}: {
  unread: number
  className?: string
  onClick?: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      aria-label={unread > 0 ? `اعلان‌ها (${unread} خوانده‌نشده)` : 'اعلان‌ها'}
      onClick={onClick}
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="bg-destructive text-destructive-foreground absolute top-1 start-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
          {unread > 9 ? '۹+' : unread.toLocaleString('fa-IR')}
        </span>
      )}
    </Button>
  )
}
