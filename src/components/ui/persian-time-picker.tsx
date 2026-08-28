'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toFaDigits } from '@/components/barber/booking/jalali'
import { cn } from '@/utils/cn'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function parseTime(v?: string): { hour: number; minute: number } {
  if (v) {
    const [a, b] = v.split(':').map(Number)
    if (Number.isFinite(a) && Number.isFinite(b)) return { hour: a, minute: b }
  }
  return { hour: 12, minute: 0 }
}

function pad(v: number): string {
  return String(v).padStart(2, '0')
}

/**
 * A calm Farsi time picker: two scrollable hour/minute columns with the live
 * selection rendered in Persian digits. Clicking a value selects it; «تأیید»
 * commits `HH:MM` (Latin digits on the wire).
 */
function PersianTimePicker({
  value,
  onChange,
  placeholder = 'انتخاب ساعت',
}: {
  value?: string
  onChange: (time: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const { hour: initialHour, minute: initialMinute } = parseTime(value)
  const [hour, setHour] = React.useState(initialHour)
  const [minute, setMinute] = React.useState(initialMinute)
  const hourRef = React.useRef<HTMLDivElement>(null)
  const minuteRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setHour(initialHour)
    setMinute(initialMinute)
  }, [initialHour, initialMinute])

  React.useEffect(() => {
    if (open) {
      hourRef.current?.children[hour]?.scrollIntoView({ block: 'center' })
      minuteRef.current?.children[minute]?.scrollIntoView({ block: 'center' })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = `${pad(hour)}:${pad(minute)}`

  const commit = () => {
    onChange(current)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
          aria-label="انتخاب ساعت"
        >
          <Clock className="size-4 text-muted-foreground" />
          <span className={cn(!value && 'text-muted-foreground')} dir="ltr">
            {value ? toFaDigits(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[232px] p-3" align="start">
        <p className="text-center text-xl font-bold tracking-wider" dir="ltr">
          {toFaDigits(current)}
        </p>

        <div className="mt-2 flex gap-2">
          <div
            ref={hourRef}
            className="h-40 flex-1 overflow-y-auto rounded-lg border p-1"
            aria-label="ساعت"
          >
            {HOURS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setHour(v)}
                className={cn(
                  'w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors',
                  v === hour
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {toFaDigits(pad(v))}
              </button>
            ))}
          </div>
          <div
            ref={minuteRef}
            className="h-40 flex-1 overflow-y-auto rounded-lg border p-1"
            aria-label="دقیقه"
          >
            {MINUTES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMinute(v)}
                className={cn(
                  'w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors',
                  v === minute
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {toFaDigits(pad(v))}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-between border-t pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={commit}>
            تأیید
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { PersianTimePicker }
