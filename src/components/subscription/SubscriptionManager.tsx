'use client'

import { AlertTriangle, Check, Crown, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { DashSubscriptionState } from '@/lib/dashboard-types'

type Plan = {
  id: string
  name: string
  description?: string | null
  price: number
  durationMonths: number
  features: string[]
}

type HistoryItem = {
  id: string
  planName?: string | null
  amount?: number | null
  status: 'active' | 'cancelled' | string
  startsAt: string
  expiresAt: string
}

type SubscriptionData = {
  state: DashSubscriptionState
  monetization: { enforceSubscription: boolean; trialDays: number }
  plans: Plan[]
  history: HistoryItem[]
}

function faNum(v: number): string {
  return v.toLocaleString('fa-IR')
}

export function SubscriptionManager() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/barber/subscription', { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error()
      setData((await res.json()) as SubscriptionData)
      setError(null)
    } catch {
      setError('خطا در دریافت اطلاعات اشتراک؛ دوباره تلاش کنید.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (error && !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          تلاش مجدد
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
          <Crown className="text-primary size-6" />
          اشتراک آرایشگاه
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          برای پذیرش نوبت، اشتراک آرایشگاه باید فعال باشد. استفاده مشتریان همیشه رایگان است.
        </p>
      </div>

      {!data ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : (
        <StatusCard state={data.state} />
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold">پلن‌ها</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {!data
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)
            : data.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onPurchased={() => void load()} />
              ))}
        </div>
        {data && data.plans.length === 0 && (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            فعلاً پلنی برای خرید موجود نیست.
          </p>
        )}
      </section>

      {data && data.history.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">تاریخچه خرید</h2>
          <div className="space-y-2">
            {data.history.map((h) => (
              <Card key={h.id} className="py-0">
                <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <span className="text-sm font-semibold">{h.planName ?? 'پلن'}</span>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span>{h.amount != null ? `${faNum(h.amount)} تومان` : '—'}</span>
                    <span>تا {new Date(h.expiresAt).toLocaleDateString('fa-IR')}</span>
                    <Badge variant={h.status === 'active' ? 'success' : 'secondary'}>
                      {h.status === 'active' ? 'فعال' : 'لغو شده'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatusCard({ state }: { state: DashSubscriptionState }) {
  const expired = state.mode === 'expired'
  const trial = state.mode === 'trial'

  return (
    <Card
      className={cn(
        'border py-0',
        expired ? 'border-destructive/40 bg-destructive/5' : trial ? 'bg-primary/5 border-primary/30' : 'border-emerald-500/30 bg-emerald-500/5',
      )}
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-full',
              expired
                ? 'bg-destructive/10 text-destructive'
                : trial
                  ? 'bg-primary/10 text-primary'
                  : 'bg-emerald-500/10 text-emerald-600',
            )}
          >
            {expired ? <AlertTriangle className="size-5" /> : trial ? <Sparkles className="size-5" /> : <ShieldCheck className="size-5" />}
          </span>
          <div>
            <p className="font-semibold">
              {expired
                ? 'اشتراک فعال ندارید'
                : trial
                  ? 'دوره آزمایشی رایگان'
                  : state.plan
                    ? `پلن ${state.plan.name}`
                    : 'اشتراک فعال'}
            </p>
            <p className="text-muted-foreground text-sm">
              {expired
                ? 'پذیرش نوبت غیرفعال است؛ برای ادامه یک پلن انتخاب کنید.'
                : state.daysLeft == null
                  ? 'حساب شما بدون محدودیت زمانی فعال است.'
                  : `${faNum(state.daysLeft)} روز باقی‌مانده`}
            </p>
          </div>
        </div>
        <Badge variant={expired ? 'destructive' : trial ? 'default' : 'success'} className="shrink-0">
          {expired ? 'منقضی' : trial ? 'آزمایشی' : 'فعال'}
        </Badge>
      </CardContent>
    </Card>
  )
}

function PlanCard({ plan, onPurchased }: { plan: Plan; onPurchased: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const purchase = async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/barber/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error()
      setOpen(false)
      onPurchased()
    } catch {
      setError('خطا در فعال‌سازی پلن؛ دوباره تلاش کنید.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="flex flex-col py-0">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold">{plan.name}</h3>
            <p className="text-muted-foreground text-xs">{faNum(plan.durationMonths)} ماهه</p>
          </div>
          <div className="text-end">
            <p className="text-primary text-lg font-extrabold">{faNum(plan.price)}</p>
            <p className="text-muted-foreground text-[11px]">تومان</p>
          </div>
        </div>

        {plan.description && (
          <p className="text-muted-foreground text-sm leading-6">{plan.description}</p>
        )}

        {plan.features.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="text-emerald-600 size-4 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <Button className="mt-auto w-full" onClick={() => setOpen(true)}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          فعال‌سازی پلن
        </Button>
      </CardContent>

      <ResponsiveModal open={open} onOpenChange={setOpen}>
        <div className="space-y-4 p-6">
          <div>
            <h3 className="text-base font-bold">فعال‌سازی «{plan.name}»</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              مبلغ {faNum(plan.price)} تومان برای {faNum(plan.durationMonths)} ماه. درگاه پرداخت به‌زودی
              متصل می‌شود و فعلاً فعال‌سازی به‌صورت آزمایشی ثبت خواهد شد.
            </p>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => void purchase()} disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              تأیید و فعال‌سازی
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              انصراف
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </Card>
  )
}
