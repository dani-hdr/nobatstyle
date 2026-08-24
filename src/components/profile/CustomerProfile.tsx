'use client'

import { CalendarClock, CalendarCheck, Search, Settings, UserRound } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { faDate } from '@/lib/dashboard-types'

import { LogoutButton } from './LogoutButton'
import { ProfileHeaderCard } from './ProfileHeaderCard'
import { useProfileData } from './use-profile-data'
import type { DashAppointment } from '@/lib/dashboard-types'
import { useEffect, useState } from 'react'

export function CustomerProfile() {
  const { data, loading, error, reload } = useProfileData()
  const [nextCount, setNextCount] = useState<number | null>(null)

  // Lightweight summary of upcoming reservations for the quick-links card.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/customer/dashboard', { cache: 'no-store' })
        if (!res.ok) return
        const dash = (await res.json()) as { appointments?: DashAppointment[] }
        if (!cancelled) {
          setNextCount(
            (dash.appointments ?? []).filter(
              (a) => a.status === 'reserved' && new Date(a.toDate).getTime() >= Date.now(),
            ).length,
          )
        }
      } catch {
        // Non-critical — ignore.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <ProfileSkeleton />
  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => void reload()}>
          تلاش مجدد
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ProfileHeaderCard user={data.user} onUpdated={reload} />

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard" className="group">
          <Card className="h-full py-0 transition-colors group-hover:border-primary/40">
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <CalendarCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">نوبت‌های من</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {nextCount === null
                    ? 'مدیریت رزروها و تاریخچه'
                    : nextCount > 0
                      ? `${nextCount.toLocaleString('fa-IR')} نوبت پیش‌رو دارید`
                      : 'در حال حاضر نوبت فعالی ندارید'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/barbers" className="group">
          <Card className="h-full py-0 transition-colors group-hover:border-primary/40">
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Search className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">رزرو نوبت جدید</p>
                <p className="text-muted-foreground mt-0.5 text-sm">جست‌وجو میان آرایشگرها</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Account details */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Settings className="size-4.5" />
          </span>
          اطلاعات حساب
        </h2>
        <Card className="py-0">
          <CardContent className="divide-y px-5 py-2">
            <InfoRow
              icon={<UserRound className="size-4" />}
              label="نام"
              value={data.user.name || '—'}
            />
            <InfoRow
              icon={<CalendarClock className="size-4" />}
              label="عضویت از"
              value={faDate(data.user.createdAt)}
            />
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-start pt-2">
        <LogoutButton />
      </div>
    </div>
  )
}

export function InfoRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </span>
      <span className="text-muted-foreground w-28 shrink-0 text-sm">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{value}</span>
      {badge && <Badge variant="secondary">{badge}</Badge>}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="size-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}
