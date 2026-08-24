'use client'

import { Check, Loader2, Save, Scissors } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CatalogService } from '@/lib/profile-types'
import { cn } from '@/utils/cn'

export function BarberServicesPicker({
  catalog,
  selectedIds,
  onUpdated,
}: {
  catalog: CatalogService[]
  selectedIds: string[]
  onUpdated: () => void | Promise<void>
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(selectedIds))
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)

  React.useEffect(() => {
    setSelected(new Set(selectedIds))
  }, [selectedIds])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    if (pending) return
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: { serviceIds: Array.from(selected) } }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'خطا در ذخیره خدمات')
      }
      setMessage({ ok: true, text: 'خدمات ارائه‌شده ذخیره شد.' })
      await onUpdated()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'خطا در ذخیره خدمات' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scissors className="text-primary size-4.5" />
          خدمات ارائه‌شده
        </CardTitle>
        <CardDescription>
          خدماتی که در آرایشگاه شما ارائه می‌شود؛ مشتریان هنگام رزرو فقط این‌ها را می‌بینند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        {catalog.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            هنوز خدمتی در کاتالوگ ثبت نشده است.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {catalog.map((s) => {
              const active = selected.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full border',
                      active && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                  {s.name}
                </button>
              )
            })}
          </div>
        )}

        {message && (
          <p className={cn('text-sm', message.ok ? 'text-emerald-600' : 'text-destructive')}>
            {message.text}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {selected.size.toLocaleString('fa-IR')} خدمت انتخاب شده
          </span>
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            ذخیره
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
