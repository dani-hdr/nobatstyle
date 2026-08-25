'use client'

import { CalendarPlus } from 'lucide-react'

import type { BarberProfile } from '@/lib/barber-profile'

import { BookingTrigger } from './booking/BookingTrigger'

/**
 * Floating booking CTA shown only on mobile. Sits above the fixed bottom nav
 * (which reserves ~64px) so it never overlaps important content.
 */
export function StickyBookingCta({ barber }: { barber: BarberProfile }) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 md:hidden">
      <div className="bg-background/95 shadow-lg backdrop-blur rounded-xl border p-2">
        <BookingTrigger
          state={barber.bookingState}
          barberId={barber.id}
          icon={<CalendarPlus className="size-5" />}
          size="lg"
          className="rounded-lg"
        />
      </div>
    </div>
  )
}
