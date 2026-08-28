'use client'

import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  Check,
  ClipboardList,
  Clock,
  Crown,
  ExternalLink,
  Loader2,
  MessageCircle,
  Scissors,
  Star,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PersianDatePicker } from '@/components/ui/persian-date-picker'
import { PersianTimePicker } from '@/components/ui/persian-time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type {
  BarberDashboardData,
  DashAppointment,
  DashService,
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
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(null)

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

  const decideRequest = async (id: string, decision: 'approve' | 'reject') => {
    setDecidingRequestId(id)
    try {
      await fetch(`/api/barber-requests/${id}/${decision}`, { method: 'POST' })
      await reload()
    } finally {
      setDecidingRequestId(null)
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
          {data.barber.id && (
            <Button asChild variant="outline">
              <Link href={`/barbers/${data.barber.id}`}>
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

      {/* Incoming customer requests */}
      <section className="space-y-4">
        <SectionTitle icon={UserPlus} title="درخواست‌های مشتریان" />
        {(data.customerRequests ?? []).length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            درخواست جدیدی وجود ندارد.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(data.customerRequests ?? []).map((r) => {
              const busy = decidingRequestId === r.id
              const name = r.customer.name || r.customer.username || 'کاربر'
              return (
                <Card key={r.id} className="py-0">
                  <CardContent className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 font-semibold">
                        <UserRound className="text-primary size-4" />
                        {name}
                      </h3>
                      <Badge variant="secondary">در انتظار تایید</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      درخواست عضویت — {faDate(r.createdAt)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busy}
                        onClick={() => void decideRequest(r.id, 'approve')}
                      >
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        تایید
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive flex-1"
                        disabled={busy}
                        onClick={() => void decideRequest(r.id, 'reject')}
                      >
                        <X className="size-4" />
                        رد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Customers */}
      <section className="space-y-4">
        <SectionTitle
          icon={Users}
          title="مشتریان من"
          extra={
            (data.customers?.length ?? 0) > 0
              ? `${(data.customers?.length ?? 0).toLocaleString('fa-IR')} مشتری`
              : undefined
          }
        />
        {(data.customers ?? []).length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            هنوز مشتری ندارید؛ درخواست‌های مشتریان را از بالا تایید کنید.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.customers!.map((c) => (
              <Card key={c.id} className="py-0">
                <CardContent className="flex items-center gap-3 px-4 py-4">
                  <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                    {(c.name || c.username || 'ک').slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name || 'کاربر'}</p>
                    {c.username && (
                      <p className="text-muted-foreground truncate text-xs">{c.username}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add appointment slot */}
      <section className="space-y-4">
        <SectionTitle icon={CalendarPlus} title="افزودن نوبت" />
        <AddSlotForm services={data.services} onAdded={reload} />
      </section>

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

      {/* Latest comments */}
      <section className="space-y-4">
        <SectionTitle icon={Star} title="آخرین دیدگاه‌ها" />
        {data.comments.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
            هنوز دیدگاهی ثبت نشده است.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.comments.slice(0, 6).map((c) => {
              const author = typeof c.author === 'object' ? c.author : null
              return (
                <Card key={c.id} className="py-0">
                  <CardContent className="px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{author?.name || 'کاربر'}</span>
                      {typeof c.rating === 'number' && (
                        <span className="flex items-center gap-1 text-sm font-bold">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {c.rating.toLocaleString('fa-IR')}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6">{c.content}</p>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {faDate(c.createdAt)}
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

/** Creates a new available appointment window for the barber's own shop. */
function AddSlotForm({
  services,
  onAdded,
}: {
  services: DashService[]
  onAdded: () => void | Promise<void>
}) {
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = Boolean(serviceId && date && from && to) && !pending

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending || !serviceId || !date || !from || !to) return
    const [fh, fm] = from.split(':').map(Number)
    const [th, tm] = to.split(':').map(Number)
    const fromDate = new Date(date)
    fromDate.setHours(fh, fm, 0, 0)
    const toDate = new Date(date)
    toDate.setHours(th, tm, 0, 0)
    if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime())) {
      setError('زمان واردشده معتبر نیست.')
      return
    }
    if (toDate <= fromDate) {
      setError('ساعت پایان باید بعد از ساعت شروع باشد.')
      return
    }
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          status: 'available',
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          errors?: { message?: string }[]
        }
        throw new Error(data.errors?.[0]?.message ?? 'ثبت نوبت ممکن نشد.')
      }
      setMessage('نوبت با موفقیت اضافه شد.')
      setFrom('')
      setTo('')
      await onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت نوبت.')
    } finally {
      setPending(false)
    }
  }

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed p-8 text-center text-sm">
        برای ثبت نوبت ابتدا از صفحه{' '}
        <Link href="/profile" className="text-primary underline underline-offset-4">
          پروفایل
        </Link>{' '}
        خدمات خود را انتخاب کنید.
      </p>
    )
  }

  return (
    <Card className="border-primary/30 py-0">
      <CardContent className="px-5 py-5">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slot-service">خدمت *</Label>
            <Select value={serviceId} onValueChange={setServiceId} dir="rtl">
              <SelectTrigger id="slot-service" className="w-full">
                <SelectValue placeholder="انتخاب خدمت" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slot-date">تاریخ *</Label>
            <PersianDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slot-from">از ساعت *</Label>
            <PersianTimePicker value={from} onChange={setFrom} placeholder="انتخاب ساعت" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slot-to">تا ساعت *</Label>
            <PersianTimePicker value={to} onChange={setTo} placeholder="انتخاب ساعت" />
          </div>

          <div className="sm:col-span-2">
            {(error || message) && (
              <p className={cn('mb-3 text-sm', error ? 'text-destructive' : 'text-emerald-600')}>
                {error ?? message}
              </p>
            )}
            <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
              افزودن نوبت
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
  if (status === 'available') return <Badge variant="warning">آزاد</Badge>
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
