'use client'

import * as React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { BarberProfile } from '@/lib/barber-profile'

import { BookingDialog } from './BookingDialog'

type BookingContextValue = {
  openBooking: (initialServiceId?: string) => void
  closeBooking: () => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({
  barber,
  children,
}: {
  barber: BarberProfile
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [initialServiceId, setInitialServiceId] = useState<string>()

  const openBooking = useCallback((initialServiceId?: string) => {
    setInitialServiceId(initialServiceId)
    setOpen(true)
  }, [])

  const closeBooking = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ openBooking, closeBooking }),
    [openBooking, closeBooking],
  )

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingDialog
        barber={barber}
        open={open}
        onOpenChange={setOpen}
        initialServiceId={initialServiceId}
      />
    </BookingContext.Provider>
  )
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider')
  return ctx
}
