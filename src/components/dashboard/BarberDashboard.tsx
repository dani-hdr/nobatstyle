'use client'

import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CalendarX2,
  ClipboardList,
  Clock,
  Crown,
  ExternalLink,
  MessageCircle,
  Scissors,
  Star,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type {
  BarberDashboardData,
  DashAppointment,
  DashSubscriptionState,
} from '@/lib/dashboard-types'
import { faDate, faTime } from '@/lib/dashboard-types'

import { DashboardSkeleton, SectionTitle } from './CustomerDashboard'
import { useDashboardData } from './use-dashboard-data'

export function BarberDashboard({ userName }: { userName?: string }) {
  const { data, loading, error, reload } = useDashboardData<BarberDashboardData>(
    '/api/barber/dashboard',
  )
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const cancelAppointment = async (id: string) => {
    setCancellingId(id)
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      await reload()
    } finally {
      setCancellingId(null)
    }
  }

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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
            {data.barber.shopName}
            {data.barber.isVerified && (
              <BadgeCheck className="size-5.5 text-emerald-500" />
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {userName ? `${userName} عزیز،` : ''} پنل مدیریت آرایشگاه شما
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/messages">
              <MessageCircle className="size-4" />
              پیام‌ها
            </Link>
          </Button>
          {data.barber.shopSlug && (
            <Button asChild variant="outline">
              <Link href={`/barbers/${data.barber.shopSlug}`}>
                مشاهده صفحه عمومی
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="icon" aria-label="پروفایل" title="پروفایل">
            <Link href="/profile">
              <UserRound className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Subscription status */}
      <SubscriptionStrip subscription={data.subscription} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Star}
          value={Number(data.statistics.rating ?? 0).toLocaleString('fa-IR')}
          label={`امتیاز از ${Number(data.statistics.reviewCount ?? 0).toLocaleString('fa-IR')} بازخورد`}
          accent
        />
        <StatCard
          icon={CalendarClock}
          value={upcoming.length.toLocaleString('fa-IR')}
          label="نوبت‌های پیش‌رو"
        />
        <StatCard
          icon={ClipboardList}
          value={Number(data.statistics.completedCount ?? 0).toLocaleString('fa-IR')}
          label="خدمات انجام‌شده"
        />
        <StatCard
          icon={CalendarX2}
          value={data.appointments
            .filter((a) => a.status === 'cancelled')
            .length.toLocaleString('fa-IR')}
          label="لغو شده"
        />
      </div>

      {/* Incoming appointments */}
      <section className="space-y-4">
        <SectionTitle icon={CalendarClock} title="نوبت‌های پیش‌رو" />
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            نوبت رزروشده‌ای در پیش ندارید.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((a) => (
              <BarberAppointmentCard
                key={a.id}
                appointment={a}
                onCancel={() => void cancelAppointment(a.id)}
                cancelling={cancellingId === a.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* All history (compact) */}
      <section className="space-y-4">
        <SectionTitle icon={ClipboardList} title="همه وقت‌ها" />
        <Card className="overflow-x-auto py-0">
          <CardContent className="px-0 py-0">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-xs">
                  <th className="px-4 py-3 text-start font-medium">خدمت</th>
                  <th className="px-4 py-3 text-start font-medium">مشتری</th>
                  <th className="px-4 py-3 text-start font-medium">زمان</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.slice(0, 20).map((a) => {
                  const service = typeof a.service === 'object' ? a.service : null
                  const customer = typeof a.customer === 'object' ? a.customer : null
                  return (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2.5">{service?.name ?? '—'}</td>
                      <td className="text-muted-foreground px-4 py-2.5">
                        {customer && typeof customer === 'object'
                          ? customer.name || customer.username || 'مشتری'
                          : '—'}
                      </td>
                      <td className="text-muted-foreground px-4 py-2.5">
                        {faDate(a.fromDate)}، {faTime(a.fromDate)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={a.status} past={new Date(a.toDate).getTime() < now} />
                      </td>
                    </tr>
                  )
                })}
                {data.appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground px-4 py-6 text-center">
                      هنوز وقتی تعریف نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Reviews */}
      <section className="space-y-4">
        <SectionTitle icon={Star} title="آخرین بازخوردها" />
        {data.reviews.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            هنوز بازخوردی ثبت نشده است.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.reviews.slice(0, 6).map((r) => {
              const customer = typeof r.customer === 'object' ? r.customer : null
              return (
                <Card key={r.id} className="py-0">
                  <CardContent className="px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {customer?.name || customer?.username || 'مشتری'}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {r.rating.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-muted-foreground mt-1.5 text-sm leading-6">{r.comment}</p>
                    )}
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {faDate(r.createdAt)}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <SectionTitle icon={UserRound} title="اعلان‌ها" />
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
                  {n.body && (
                    <p className="text-muted-foreground mt-1 text-sm leading-6">{n.body}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Star
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <Card className={cn('py-0', accent && 'border-primary/30 bg-primary/5')}>
      <CardContent className="flex items-center gap-3 px-4 py-4">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            accent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold">{value}</p>
          <p className="text-muted-foreground truncate text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function BarberAppointmentCard({
  appointment,
  onCancel,
  cancelling,
}: {
  appointment: DashAppointment
  onCancel: () => void
  cancelling: boolean
}) {
  const service = typeof appointment.service === 'object' ? appointment.service : null
  const customer = typeof appointment.customer === 'object' ? appointment.customer : null

  return (
    <Card className="py-0">
      <CardContent className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-semibold">
            <Scissors className="text-primary size-4" />
            {service?.name ?? 'خدمت'}
          </h3>
          <Badge variant="success">رزرو شده</Badge>
        </div>
        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
          <p className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" />
            {faDate(appointment.fromDate)} — ساعت {faTime(appointment.fromDate)}
          </p>
          <p className="flex items-center gap-1.5">
            <UserRound className="size-3.5" />
            {customer?.name || customer?.username || 'بدون نام'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive mt-3 w-full"
          disabled={cancelling}
          onClick={onCancel}
        >
          <CalendarX2 className="size-4" />
          لغو نوبت
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status, past }: { status: DashAppointment['status']; past?: boolean }) {
  if (status === 'cancelled') return <Badge variant="destructive">لغو شده</Badge>
  if (past) return <Badge variant="secondary">انجام شده</Badge>
  return <Badge variant="success">رزرو شده</Badge>
}

function SubscriptionStrip({ subscription }: { subscription: DashSubscriptionState }) {
  if (subscription.mode === 'active' && (subscription.daysLeft == null || subscription.daysLeft > 7)) {
    return null
  }

  const expired = subscription.mode === 'expired'
  const expiringSoon = !expired && subscription.daysLeft != null && subscription.daysLeft <= 7

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4',
        expired ? 'border-destructive/40 bg-destructive/5' : 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full',
            expired ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
          )}
        >
          {expired ? <AlertTriangle className="size-4.5" /> : <Crown className="size-4.5" />}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {expired
              ? 'اشتراک شما منقضی شده است'
              : subscription.mode === 'trial'
                ? `دوره آزمایشی رایگان — ${subscription.daysLeft?.toLocaleString('fa-IR')} روز مانده`
                : `پلن ${subscription.plan?.name ?? ''} — ${subscription.daysLeft?.toLocaleString('fa-IR')} روز مانده`}
          </p>
          <p className="text-muted-foreground text-xs">
            {expired
              ? 'پذیرش نوبت غیرفعال است؛ برای ادامه اشتراک را فعال کنید.'
              : 'برای تمدید و مدیریت اشتراک به صفحه اشتراک بروید.'}
          </p>
        </div>
      </div>
      {(expired || expiringSoon) && (
        <Button asChild size="sm">
          <Link href="/subscription">
            <Crown className="size-4" />
            مدیریت اشتراک
          </Link>
        </Button>
      )}
    </div>
  )
}
