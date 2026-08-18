'use client'

import { CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, Scissors } from 'lucide-react'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDuration,
  formatPrice,
  type BarberProfile,
  type BarberService,
} from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { buildAvailableDays, buildSlotsForDay, defaultAvailable, formatJalaliShort, toFaDigits } from './jalali'
import { JalaliCalendar } from './JalaliCalendar'

type BookingDialogProps = {
  barber: BarberProfile
  open: boolean
  onOpenChange: (open: boolean) => void
  initialServiceId?: string
}

const STEP_LABELS = ['تاریخ', 'خدمات', 'ساعت', 'تایید']

export function BookingDialog({
  barber,
  open,
  onOpenChange,
  initialServiceId,
}: BookingDialogProps) {
  const [step, setStep] = useState(0)
  const [success, setSuccess] = useState(false)

  const [selectedDateKey, setSelectedDateKey] = useState<string>()
  const [selectedServiceId, setSelectedServiceId] = useState<string>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [notes, setNotes] = useState('')

  const availableDays = useMemo(() => buildAvailableDays(barber.availabilityDays), [barber.availabilityDays])
  const selectedService = useMemo(
    () => barber.services.find((s) => s.id === selectedServiceId),
    [barber.services, selectedServiceId],
  )

  const slots = useMemo(
    () => (selectedDateKey ? buildSlotsForDay(selectedDateKey) : []),
    [selectedDateKey],
  )
  const selectedDateMeta = availableDays.find((d) => d.key === selectedDateKey)

  // Reset whenever the dialog opens
  useEffect(() => {
    if (open) {
      setStep(0)
      setSuccess(false)
      setSelectedDateKey(defaultAvailable(availableDays))
      setSelectedServiceId(initialServiceId)
      setSelectedTime(undefined)
      setNotes('')
    }
  }, [open, availableDays, initialServiceId])

  const selectDay = useCallback((key: string, dayAvailable: boolean) => {
    if (!dayAvailable) return
    setSelectedDateKey(key)
    setSelectedTime(undefined)
  }, [])

  const nextEnabled =
    (step === 0 && Boolean(selectedDateKey)) ||
    (step === 1 && Boolean(selectedServiceId)) ||
    (step === 2 && Boolean(selectedDateKey) && Boolean(selectedTime))

  const handleNext = () => {
    if (step === 3) return
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step === 0) {
      onOpenChange(false)
      return
    }
    setStep((s) => s - 1)
  }

  const confirmBooking = () => {
    setSuccess(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!success}
        className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b p-5">
          <DialogTitle className="text-base">
            {success ? 'رزرو نوبت' : `رزرو نوبت — ${barber.shopName}`}
          </DialogTitle>
          <DialogDescription>
            {success
              ? 'نوبت با موفقیت ثبت شد'
              : 'در چند قدم ساده نوبت موردنظرت رو رزرو کن'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <SuccessView
            barber={barber}
            serviceName={selectedService?.name}
            dateLabel={selectedDateMeta ? formatJalaliShort(selectedDateMeta.date) : undefined}
            time={selectedTime}
            onNearbyClose={() => onOpenChange(false)}
          />
        ) : (
          <>
            <Stepper current={step} />

            <div className="overflow-y-auto p-5">
              {step === 0 && (
                <DateStep
                  availableDays={availableDays}
                  selectedDateKey={selectedDateKey}
                  onSelect={selectDay}
                />
              )}
              {step === 1 && (
                <ServiceStep
                  services={barber.services}
                  selectedId={selectedServiceId}
                  onSelect={setSelectedServiceId}
                />
              )}
              {step === 2 && (
                <TimeStep
                  selectedDateKey={selectedDateKey}
                  selectedTime={selectedTime}
                  slots={slots}
                  onSelect={setSelectedTime}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  barber={barber}
                  service={selectedService}
                  dateKey={selectedDateKey}
                  dateMeta={selectedDateMeta}
                  time={selectedTime}
                  notes={notes}
                  setNotes={setNotes}
                />
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronRight className="size-4" />
                  {step === 0 ? 'انصراف' : 'قبلی'}
                </Button>

                {step < 3 ? (
                  <Button onClick={handleNext} disabled={!nextEnabled} className="px-6">
                    بعدی
                    <ChevronLeft className="size-4" />
                  </Button>
                ) : (
                  <Button onClick={confirmBooking} disabled={!nextEnabled} className="px-6">
                    <CalendarCheck className="size-4" />
                    تایید رزرو
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 px-5 pt-4">
      {STEP_LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={cn('bg-muted h-px flex-1', done && 'bg-primary')} />}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary/10 text-primary ring-1 ring-primary',
                  !done && !active && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3" /> : toFaDigits(i + 1)}
              </span>
              <span
                className={cn(
                  'text-xs',
                  active ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function DateStep({
  availableDays,
  selectedDateKey,
  onSelect,
}: {
  availableDays: ReturnType<typeof buildAvailableDays>
  selectedDateKey?: string
  onSelect: (key: string, available: boolean) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">انتخاب تاریخ</h3>
        <p className="text-muted-foreground text-xs">تاریخ مورد نظر خود را انتخاب کنید</p>
      </div>

      <JalaliCalendar selectedKey={selectedDateKey} onSelect={onSelect} />

      <div>
        <h4 className="text-muted-foreground mb-2 text-xs font-medium">روزهای پیش رو</h4>
        <div className="grid grid-cols-4 gap-2">
          {availableDays.map((day) => (
            <button
              key={day.key}
              type="button"
              disabled={!day.available}
              onClick={() => onSelect(day.key, day.available)}
              className={cn(
                'rounded-lg border py-2 text-center text-xs transition-colors',
                !day.available && 'text-muted-foreground/50 cursor-not-allowed line-through',
                day.available &&
                  selectedDateKey !== day.key &&
                  'hover:bg-muted cursor-pointer',
                day.available && selectedDateKey === day.key && 'bg-primary text-primary-foreground border-primary',
              )}
            >
              {formatJalaliShort(day.date)}
            </button>
          ))}
        </div>
      </div>

      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-primary size-3 rounded" />
        انتخابی
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-background size-3 rounded border" />
        آزاد
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground bg-muted size-3 rounded" />
        غیرفعال
      </span>
    </div>
  )
}

function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: BarberService[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">انتخاب خدمات</h3>
        <p className="text-muted-foreground text-xs">خدمات مورد نظر خود را انتخاب کنید</p>
      </div>
      <div className="space-y-2">
        {services.map((service) => {
          const selected = service.id === selectedId
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-start transition-colors',
                selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-muted-foreground text-xs">{formatDuration(service.durationMinutes)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {formatPrice(service.price) && (
                  <span className="text-muted-foreground text-xs">{formatPrice(service.price)}</span>
                )}
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border transition-colors',
                    selected && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {selected && <Check className="size-3" />}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeStep({
  selectedDateKey,
  selectedTime,
  slots,
  onSelect,
}: {
  selectedDateKey?: string
  selectedTime?: string
  slots: ReturnType<typeof buildSlotsForDay>
  onSelect: (time: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">انتخاب ساعت</h3>
        <p className="text-muted-foreground text-xs">ساعت مورد نظر خود را انتخاب کنید</p>
      </div>
      {selectedDateKey && (
        <p className="text-primary bg-primary/5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <CalendarCheck className="size-3.5" />
          تاریخ انتخابی: {selectedDateKey.split('/').map(toFaDigits).join('/')}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot.time)}
            className={cn(
              'flex items-center justify-center gap-1 rounded-lg border py-3 text-sm font-medium transition-colors',
              !slot.available && 'text-muted-foreground/40 cursor-not-allowed line-through',
              slot.available &&
                selectedTime !== slot.time &&
                'hover:bg-muted cursor-pointer',
              slot.available && selectedTime === slot.time && 'bg-primary text-primary-foreground border-primary',
            )}
          >
            <Clock className="size-4" />
            {toFaDigits(slot.time)}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewStep({
  barber,
  service,
  dateKey,
  dateMeta,
  time,
  notes,
  setNotes,
}: {
  barber: BarberProfile
  service?: BarberService
  dateKey?: string
  dateMeta?: ReturnType<typeof buildAvailableDays>[number]
  time?: string
  notes: string
  setNotes: (v: string) => void
}) {
  const rows = [
    { label: 'آرایشگر', value: barber.shopName },
    { label: 'خدمت', value: service?.name },
    {
      label: 'تاریخ',
      value: dateMeta ? formatJalaliShort(dateMeta.date) : dateKey,
    },
    { label: 'ساعت', value: time },
    { label: 'مدت', value: service ? formatDuration(service.durationMinutes) : undefined },
  ].filter((r) => r.value)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">بررسی و تایید</h3>
        <p className="text-muted-foreground text-xs">جزئیات نوبت را بررسی کنید</p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        {rows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <Separator />}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-sm">{row.label}</span>
              <span className="text-sm font-medium">{row.value}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="booking-note">توضیحات</Label>
        <Textarea
          id="booking-note"
          placeholder="اگر توضیح خاصی دارید اینجا بنویسید..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

function SuccessView({
  barber,
  serviceName,
  dateLabel,
  time,
  onNearbyClose,
}: {
  barber: BarberProfile
  serviceName?: string
  dateLabel?: string
  time?: string
  onNearbyClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <span className="bg-emerald-500/15 text-emerald-600 flex size-14 items-center justify-center rounded-full">
        <Check className="size-7" />
      </span>
      <DialogTitle className="text-lg">نوبت شما با موفقیت رزرو شد</DialogTitle>
      <p className="text-muted-foreground text-sm">
        برای {barber.shopName}، رزرو شما ثبت شد و در بخش «نوبت‌های من» قابل مشاهده است.
      </p>

      <div className="w-full space-y-2 rounded-lg border p-4 text-start text-sm">
        <SummaryRow label="آرایشگر" value={barber.shopName} icon={<Scissors className="size-4" />} />
        <SummaryRow label="خدمت" value={serviceName} icon={<Check className="size-4" />} />
        <SummaryRow label="تاریخ" value={dateLabel} icon={<CalendarCheck className="size-4" />} />
        <SummaryRow label="ساعت" value={time ? toFaDigits(time) : undefined} icon={<Clock className="size-4" />} />
      </div>

      <div className="mt-2 flex w-full flex-col gap-2">
        <Button asChild>
          <Link href="/appointments" onClick={onNearbyClose}>
            نوبت‌های من
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" onClick={onNearbyClose}>
            بازگشت به صفحه اصلی
          </Link>
        </Button>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string
  value?: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
