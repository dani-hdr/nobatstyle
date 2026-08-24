'use client'

import {
  CalendarClock,
  CalendarX2,
  CircleCheck,
  ClipboardList,
  Clock,
  LogIn,
  MapPin,
  Scissors,
  Search,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { DashAppointment } from '@/lib/dashboard-types'
import { faDate, faTime } from '@/lib/dashboard-types'

import { useDashboardData } from './use-dashboard-data'
import type { CustomerDashboardData } from '@/lib/dashboard-types'
import { useState } from 'react'

type Tab = 'upcoming' | 'past' | 'cancelled'

const TABS: { key: Tab; label: string; icon: typeof CalendarClock }[] = [
  { key: 'upcoming', label: 'نوبت‌های پیش‌رو', icon: CalendarClock },
  { key: 'past', label: 'گذشته', icon: CircleCheck },
  { key: 'cancelled', label: 'لغو شده', icon: CalendarX2 },
]

export function CustomerDashboard({ userName }: { userName?: string }) {
  const { data, loading, error, reload } = useDashboardData<CustomerDashboardData>(
    '/api/customer/dashboard',
  )
  const [tab, setTab] = useState<Tab>('upcoming')

  if (loading) return <DashboardSkeleton />
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

  const now = Date.now()
  const upcoming = data.appointments.filter(
    (a) => a.status === 'reserved' && new Date(a.toDate).getTime() >= now,
  )

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {userName ? `سلام، ${userName}` : 'سلام'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نوبت‌ها و اعلان‌های خود را از این‌جا مدیریت کنید.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/barbers">
              <Search className="size-4" />
              رزرو نوبت جدید
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="پروفایل" title="پروفایل">
            <Link href="/profile">
              <UserRound className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Next appointment */}
      {data.nextAppointment ? (
        <NextAppointmentCard appointment={data.nextAppointment} />
      ) : (
        <Card className="border-dashed py-0">
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
            <CalendarClock className="size-8 opacity-50" />
            نوبت فعالی ندارید؛ از میان آرایشگرها یکی را انتخاب کنید.
            <Button asChild size="sm" variant="secondary" className="mt-2">
              <Link href="/barbers">مشاهده آرایشگرها</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appointments tabs */}
      <section className="space-y-4">
        <SectionTitle icon={ClipboardList} title="تاریخچه نوبت‌ها" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count =
              key === 'upcoming'
                ? upcoming.length
                : key === 'past'
                  ? data.pastAppointments.filter((a) => a.status !== 'cancelled').length
                  : data.cancelledAppointments.length
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  tab === key
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-4" />
                {label}
                <span className="text-xs opacity-70">({count.toLocaleString('fa-IR')})</span>
              </button>
            )
          })}
        </div>

        {(() => {
          const list =
            tab === 'upcoming'
              ? upcoming
              : tab === 'past'
                ? data.pastAppointments
                    .filter((a) => a.status !== 'cancelled')
                    .filter((a) => new Date(a.toDate).getTime() < now)
                    .reverse()
                : data.cancelledAppointments

          if (list.length === 0) {
            return (
              <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
                موردی برای نمایش نیست.
              </p>
            )
          }
          return (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((a) => (
                <AppointmentCard key={a.id} appointment={a} past={tab === 'past'} />
              ))}
            </div>
          )
        })()}
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <SectionTitle icon={LogIn} title="اعلان‌ها" />
        {data.notifications.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            اعلان جدیدی ندارید.
          </p>
        ) : (
          <div className="space-y-2">
            {data.notifications.map((n) => (
              <Card key={n.id} className="py-0">
                <CardContent className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{n.title || 'اعلان'}</span>
                    {!n.readAt && <Badge variant="success">جدید</Badge>}
                  </div>
                  {n.body && <p className="text-muted-foreground mt-1 text-sm leading-6">{n.body}</p>}
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {faDate(n.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function NextAppointmentCard({ appointment }: { appointment: DashAppointment }) {
  const service = typeof appointment.service === 'object' ? appointment.service : null
  const barber = typeof appointment.barber === 'object' ? appointment.barber : null

  return (
    <Card className="border-primary/30 bg-primary/5 py-0">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
        <div className="min-w-0">
          <span className="text-primary text-xs font-medium">نوبت بعدی شما</span>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
            <Scissors className="text-primary size-4.5" />
            {service?.name ?? 'خدمت'}
          </h2>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-4" />
              {faDate(appointment.fromDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              ساعت {faTime(appointment.fromDate)}
            </span>
            {barber?.shopSlug && (
              <Link
                href={`/barbers/${barber.shopSlug}`}
                className="text-primary flex items-center gap-1 underline-offset-4 hover:underline"
              >
                <MapPin className="size-4" />
                {barber.shopName}
              </Link>
            )}
          </div>
        </div>
        <Badge variant="success" className="shrink-0">
          رزرو شده
        </Badge>
      </CardContent>
    </Card>
  )
}

function AppointmentCard({
  appointment,
  past,
}: {
  appointment: DashAppointment
  past?: boolean
}) {
  const service = typeof appointment.service === 'object' ? appointment.service : null
  const barber = typeof appointment.barber === 'object' ? appointment.barber : null
  const cancelled = appointment.status === 'cancelled'

  return (
    <Card className={cn('py-0', cancelled && 'opacity-70')}>
      <CardContent className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{service?.name ?? 'خدمت'}</h3>
          {cancelled ? (
            <Badge variant="destructive">لغو شده</Badge>
          ) : past ? (
            <Badge variant="secondary">انجام شده</Badge>
          ) : (
            <Badge variant="success">رزرو شده</Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
          <p className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" />
            {faDate(appointment.fromDate)} — ساعت {faTime(appointment.fromDate)}
          </p>
          {barber?.shopName && (
            <p className="flex items-center gap-1.5">
              <Scissors className="size-3.5" />
              {barber.shopSlug ? (
                <Link href={`/barbers/${barber.shopSlug}`} className="hover:underline">
                  {barber.shopName}
                </Link>
              ) : (
                barber.shopName
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon
  title: string
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold">
      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4.5" />
      </span>
      {title}
    </h2>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}
