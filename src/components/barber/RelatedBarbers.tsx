import { MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { RelatedBarber } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { BOOKING_STATE_LABELS, type BookingState } from './booking/BookingTrigger'
import { SectionHeading } from './SectionHeading'

export function RelatedBarbers({ barbers }: { barbers: RelatedBarber[] }) {
  return (
    <section id="related" className="scroll-mt-20">
      <SectionHeading title="آرایشگرهای مشابه" subtitle="شاید این گزینه‌ها هم برای شما مناسب باشند" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((barber) => (
          <Card key={barber.id} className="gap-0 py-0">
            <Link href={`/barbers/${barber.slug}`} className="relative block aspect-[4/4] overflow-hidden rounded-t-xl">
              <Image
                src={barber.avatar.url}
                alt={barber.avatar.alt ?? barber.shopName}
                fill
                sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </Link>

            <CardContent className="flex flex-col gap-2 pt-4">
              <h3 className="font-semibold">{barber.shopName}</h3>

              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 font-semibold">
                  <Star className="text-amber-400 fill-amber-400 size-4" />
                  {barber.rating.toLocaleString('fa-IR')}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({barber.reviewCount.toLocaleString('fa-IR')} نظر)
                </span>
              </div>

              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <MapPin className="size-3.5" />
                {barber.city}
              </span>

              <Badge variant="secondary" className="w-fit text-xs">
                {barber.mainService}
              </Badge>

              <div className="mt-2">
                <BarberCardCta barber={barber} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function BarberCardCta({ barber }: { barber: RelatedBarber }) {
  const state: BookingState = barber.bookingState
  if (state === 'pending') {
    return (
      <span className="text-muted-foreground inline-flex w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-sm">
        {BOOKING_STATE_LABELS[state]}
      </span>
    )
  }
  return (
    <Button variant="default" size="sm" className="w-full rounded-lg" asChild>
      <Link href={`/barbers/${barber.slug}`}>{BOOKING_STATE_LABELS[state]}</Link>
    </Button>
  )
}
