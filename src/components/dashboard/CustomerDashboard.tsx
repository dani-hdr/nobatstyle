'use client'

import {
  CalendarClock,
  CalendarX2,
  CircleCheck,
  Clock,
  MapPin,
  MessageCircle,
  Scissors,
  Search,
  Star,
  UserCheck,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils/cn'
import type {
  CustomerDashboardData,
  CustomerTab,
  DashAppointment,
  DashBarber,
} from '@/lib/dashboard-types'
import { faDate, faTime } from '@/lib/dashboard-types'

import { Pager } from './Pager'
import { useDashboardData } from './use-dashboard-data'

const PAGE_SIZE = 6

const TABS: { key: CustomerTab; label: string; icon: LucideIcon }[] = [
  { key: 'upcoming', label: 'نوبت‌های پیش‌رو', icon: CalendarClock },
  { key: 'past', label: 'گذشته', icon: CircleCheck },
  { key: 'cancelled', label: 'لغو شده', icon: CalendarX2 },
  { key: 'barbers', label: 'آرایشگرهای من', icon: UserCheck },
]

export function CustomerDashboard({ userName }: { userName?: string }) {
  const [tab, setTab] = useState<CustomerTab>('upcoming')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useDashboardData<CustomerDashboardData>(
    '/api/customer/dashboard',
    { tab, page, limit: PAGE_SIZE },
  )

  const switchTab = (next: string) => {
    setTab(next as CustomerTab)
    setPage(1)
  }

  if (error && !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => void reload()}>
          تلاش مجدد
        </Button>
      </div>
    )
  }

  const ready = data?.tab === tab && data.page === page
  const isLoading = loading || !ready

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {userName ? `سلام، ${userName}` : 'سلام'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نوبت‌های خود را از این‌جا مدیریت کنید.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/messages">
              <MessageCircle className="size-4" />
              پیام‌ها
            </Link>
          </Button>
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
      {ready && data?.nextAppointment ? (
        <NextAppointmentCard appointment={data.nextAppointment} />
      ) : (
        !isLoading && (
          <Card className="border-dashed py-0">
            <CardContent className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
              <CalendarClock className="size-8 opacity-50" />
              نوبت فعالی ندارید؛ از میان آرایشگرها یکی را انتخاب کنید.
              <Button asChild size="sm" variant="secondary" className="mt-2">
                <Link href="/barbers">مشاهده آرایشگرها</Link>
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Appointments tabs */}
      <Tabs value={tab} onValueChange={switchTab} className="gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <TabsList className="bg-muted/60 h-auto w-full flex-nowrap justify-start gap-1 rounded-xl p-1">
            {TABS.map(({ key, label, icon: Icon }) => {
              const count = data?.counts ? data.counts[key] : 0
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="h-9 shrink-0 rounded-lg px-3.5 data-[state=active]:bg-background"
                >
                  <Icon className="size-4" />
                  {label}
                  {count > 0 && (
                    <span className="text-xs opacity-70">({count.toLocaleString('fa-IR')})</span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {(['upcoming', 'past', 'cancelled'] as CustomerTab[]).map((key) => (
          <TabsContent key={key} value={key} className="gap-0">
            {isLoading ? (
              <ListSkeleton />
            ) : (data?.appointments.length ?? 0) === 0 ? (
              <EmptyState text="موردی برای نمایش نیست." />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data?.appointments.map((a) => (
                    <AppointmentCard key={a.id} appointment={a} past={key === 'past'} />
                  ))}
                </div>
                <Pager page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
              </>
            )}
          </TabsContent>
        ))}

        <TabsContent value="barbers" className="gap-0">
          {isLoading ? (
            <ListSkeleton />
          ) : (data?.barbers.length ?? 0) === 0 ? (
            <EmptyState text="هنوز به آرایشگری متصل نیستید؛ از میان آرایشگرها درخواست عضویت بدهید." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data?.barbers.map((b) => (
                  <BarberCard key={b.id} barber={b} />
                ))}
              </div>
              <Pager page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </>
          )}
        </TabsContent>
      </Tabs>
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
            {barber?.id && (
              <Link
                href={`/barbers/${barber.id}`}
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
              {barber.id ? (
                <Link href={`/barbers/${barber.id}`} className="hover:underline">
                  {barber.shopName}
                </Link>
              ) : (
                barber.shopName
              )}
            </p>
          )}
          {appointment.customerMessage && (
            <p className="bg-muted/60 border-border mt-2 rounded-lg border px-3 py-2 text-xs leading-6">
              <span className="font-medium">پیام شما:</span> {appointment.customerMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BarberCard({ barber }: { barber: DashBarber }) {
  return (
    <Link
      href={`/barbers/${barber.id}`}
      className="border bg-background hover:bg-accent flex items-center gap-4 rounded-2xl p-4 transition-colors"
    >
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-xl">
        {barber.avatar?.url ? (
          <Image
            src={barber.avatar.url}
            alt={barber.avatar.alt || barber.shopName}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-bold">
            {barber.shopName.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{barber.shopName}</h3>
        {typeof barber.city === 'object' && barber.city?.name && (
          <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {barber.city.name}
          </span>
        )}
      </div>
      {barber.rating ? (
        <div className="flex shrink-0 flex-col items-center">
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Star className="fill-amber-400 size-4 text-amber-400" />
            {barber.rating.toLocaleString('fa-IR')}
          </span>
          <span className="text-muted-foreground text-xs">
            {(barber.reviewCount ?? 0).toLocaleString('fa-IR')} بازخورد
          </span>
        </div>
      ) : null}
    </Link>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
      {text}
    </p>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  )
}

export function SectionTitle({
  icon: Icon,
  title,
  extra,
}: {
  icon: LucideIcon
  title: string
  extra?: string
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold">
      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4.5" />
      </span>
      {title}
      {extra && <span className="text-muted-foreground text-xs font-normal">{extra}</span>}
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
