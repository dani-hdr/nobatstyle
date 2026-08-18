'use client'

import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'

import { useBooking } from './booking-context'

export type BookingState = 'booking' | 'request' | 'pending'

export const BOOKING_STATE_LABELS: Record<BookingState, string> = {
  booking: 'رزرو نوبت',
  request: 'ثبت درخواست',
  pending: 'در انتظار تایید',
}

type BookingTriggerProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  children?: ReactNode
  initialServiceId?: string
}

/** A button that opens the booking flow, optionally preselected to a service. */
export function BookingTrigger({
  children,
  initialServiceId,
  state = 'booking',
  ...buttonProps
}: BookingTriggerProps & { state?: BookingState }) {
  const { openBooking } = useBooking()

  const label = BOOKING_STATE_LABELS[state]
  const disabled = buttonProps.disabled || state === 'pending'

  return (
    <Button size='lg' {...buttonProps} disabled={disabled} onClick={() => openBooking(initialServiceId)}>
      {children ?? label}
    </Button>
  )
}
