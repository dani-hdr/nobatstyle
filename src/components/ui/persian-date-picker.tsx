'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { buildMonthGrid, toFaDigits, WEEKDAYS } from '@/components/barber/booking/jalali'
import { cn } from '@/utils/cn'

function keyFromDate(d: Date): string {
  return new DateObject(d).convert(persian).format('YYYY/MM/DD')
}

function toDateFromKey(key: string): Date {
  const [y, m, d] = key.split('/').map(Number)
  return new DateObject({ calendar: persian, year: y, month: m, day: d }).toDate()
}

function fmtLong(d: Date): string {
  return new DateObject(d).convert(persian, persian_fa).format('dddd D MMMM YYYY')
}

function fmtMonth(d: Date): string {
  return new DateObject(d).convert(persian, persian_fa).format('MMMM YYYY')
}

function startOfToday(): Date {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

/**
 * A Jalali (Persian) date picker with month navigation and a clean popover UI.
 * All in-month days are enabled; past days (before today) are disabled.
 */
function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
}: {
  value?: Date
  onChange: (date: Date) => void
  placeholder?: string
}) {
  const today = startOfToday()
  const [viewDate, setViewDate] = React.useState<Date>(value ?? today)
  const [open, setOpen] = React.useState(false)

  const cells = React.useMemo(() => buildMonthGrid(viewDate), [viewDate])
  const selectedKey = value ? keyFromDate(value) : undefined
  const todayKey = keyFromDate(today)

  const moveMonth = (delta: number) => {
    setViewDate((prev) => new DateObject(prev).add(delta, 'month').toDate())
  }

  const jumpToToday = () => {
    const d = startOfToday()
    setViewDate(d)
    onChange(d)
    setOpen(false)
  }

  const pick = (cell: { key: string; date: Date; inMonth: boolean; available: boolean }) => {
    if (!cell.inMonth) return
    onChange(cell.date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
          aria-label="انتخاب تاریخ"
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className={cn(!value && 'text-muted-foreground')}>
            {value ? fmtLong(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3" align="start">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(-1)} aria-label="ماه قبل">
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-sm font-semibold">{fmtMonth(viewDate)}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(1)} aria-label="ماه بعد">
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center">
          {WEEKDAYS.map((d, i) => (
            <span
              key={i}
              className={cn(
                'text-muted-foreground py-1 text-[11px] font-medium',
                i === WEEKDAYS.length - 1 && 'text-rose-500',
              )}
            >
              {d}
            </span>
          ))}
          {cells.map((cell, i) => {
            const beforeToday = cell.date.getTime() < today.getTime()
            const selected = cell.inMonth && cell.key === selectedKey
            const isToday = cell.inMonth && cell.key === todayKey
            return (
              <button
                key={i}
                type="button"
                disabled={!cell.inMonth || beforeToday}
                onClick={() => pick(cell)}
                className={cn(
                  'mx-auto my-0.5 flex size-9 items-center justify-center rounded-lg text-sm transition-colors',
                  !cell.inMonth && 'pointer-events-none text-muted-foreground/30',
                  cell.inMonth && beforeToday && 'cursor-not-allowed text-muted-foreground/40',
                  cell.inMonth && !beforeToday && !selected && 'hover:bg-muted cursor-pointer',
                  isToday && !selected && 'text-primary font-semibold',
                  selected && 'bg-primary text-primary-foreground font-semibold',
                )}
              >
                {toFaDigits(cell.day)}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={jumpToToday}>
            امروز
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!value}
            onClick={() => {
              setOpen(false)
            }}
          >
            تأیید
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { PersianDatePicker }
