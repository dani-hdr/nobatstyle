'use client'

import * as React from 'react'
import { useMemo } from 'react'

import { cn } from '@/utils/cn'
import { buildMonthGrid, WEEKDAYS, toFaDigits } from './jalali'

function JalaliCalendar({
  selectedKey,
  onSelect,
  allowedKeys,
}: {
  selectedKey?: string
  onSelect: (key: string, available: boolean) => void
  /** Booking window (yyyy/MM/dd keys). Days outside it are disabled. */
  allowedKeys?: Set<string>
}) {
  const cells = useMemo(() => buildMonthGrid(new Date(), allowedKeys), [allowedKeys])

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span
            key={i}
            className={cn(
              'text-muted-foreground pb-2 text-xs font-medium',
              i === WEEKDAYS.length - 1 && 'text-rose-500',
            )}
          >
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          const selected = cell.inMonth && cell.key === selectedKey
          return (
            <button
              key={i}
              type="button"
              disabled={!cell.available}
              onClick={() => onSelect(cell.key, cell.available)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                !cell.inMonth && 'pointer-events-none text-muted-foreground/40',
                cell.inMonth && !cell.available && 'text-muted-foreground cursor-not-allowed line-through',
                cell.inMonth && cell.available && !selected && 'hover:bg-muted cursor-pointer',
                selected && 'bg-primary text-primary-foreground font-semibold',
              )}
            >
              {toFaDigits(cell.day)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { JalaliCalendar }
