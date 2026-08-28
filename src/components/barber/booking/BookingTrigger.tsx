'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

import { useBooking } from './booking-context'

export type BookingState = 'booking' | 'request' | 'pending'

export const BOOKING_STATE_LABELS: Record<BookingState, string> = {
  booking: 'رزرو نوبت',
  request: 'ثبت درخواست',
  pending: 'در انتظار تایید',
}

type BookingTriggerProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  /** Server-computed relationship state driving the CTA behaviour. */
  state?: BookingState
  /** Optional leading icon; the label is derived from the current state. */
  icon?: ReactNode
  initialServiceId?: string
  barberId?: string
  /** True when the shop offers no service or has no free slot. */
  unavailable?: boolean
}

/**
 * The booking CTA. Its behaviour follows the viewer's relationship to the
 * shop (server-computed `state`):
 * - `booking`: opens the reservation wizard;
 * - `request`: sends a customer request to the barber (401 → login page);
 * - `pending`: disabled while the barber has not approved yet.
 */
export function BookingTrigger({
  icon,
  initialServiceId,
  state = 'booking',
  barberId,
  unavailable = false,
  className,
  ...buttonProps
}: BookingTriggerProps) {
  const router = useRouter()
  const { openBooking } = useBooking()
  const [localState, setLocalState] = useState<BookingState>(state)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep the optimistic local state in sync with server-rendered truth.
  useEffect(() => {
    setLocalState(state)
  }, [state])

  // Only the actual «رزرو نوبت» (booking) CTA is blocked when the shop has no
  // service or no free slot; membership requests stay available.
  const noAvailability = localState === 'booking' && unavailable

  const disabled = buttonProps.disabled || sending || localState === 'pending' || noAvailability

  const onClick = () => {
    setError(null)
    if (localState === 'request') {
      void sendRequest()
      return
    }
    openBooking(initialServiceId)
  }

  const sendRequest = async () => {
    if (!barberId) {
      setError('امکان ثبت درخواست نیست.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/barber-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId }),
      })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'خطا در ثبت درخواست')
      }
      setLocalState('pending')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت درخواست')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <Button size='lg' {...buttonProps} className='w-full' disabled={disabled} onClick={onClick}>
        {sending ? <Loader2 className='size-4 animate-spin' /> : icon}
        {BOOKING_STATE_LABELS[localState]}
      </Button>
      {localState === 'pending' && (
        <p className='text-muted-foreground mt-1.5 text-center text-xs'>
          تا زمان تایید آرایشگر امکان رزرو وجود ندارد
        </p>
      )}
      {noAvailability && (
        <p className='text-muted-foreground mt-1.5 text-center text-xs'>
          این آرایشگاه در حال حاضر خدمتی ثبت نکرده یا نوبت آزاد ندارد.
        </p>
      )}
      {error && <p className='text-destructive mt-1.5 text-center text-xs'>{error}</p>}
    </div>
  )
}
