'use client'

import { BadgeCheck, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type BarberProfile,
} from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { BookingTrigger } from './booking/BookingTrigger'
import { StatusBadge } from './StatusBadge'

const STATUS_NOTE: Record<BarberProfile['status'], string> = {
  open: 'هم‌اکنون باز است',
  away: 'به‌زودی در دسترس',
  closed: 'در حال حاضر بسته است',
}

export function BarberHero({ barber }: { barber: BarberProfile }) {
  const [active, setActive] = useState(0)
  const gallery = barber.gallery

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      {/* Cover / gallery */}
      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={gallery[active]?.url ?? barber.coverImage.url}
            alt={gallery[active]?.alt ?? barber.coverImage.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition-all duration-300"
          />
          {barber.verified && (
            <Badge variant="secondary" className="bg-background/90 absolute top-3 start-3 gap-1 shadow-sm">
              <BadgeCheck className="size-3.5 text-emerald-500" />
              تایید شده
            </Badge>
          )}
        </div>

        {/* Gallery thumbnails */}
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={img.alt}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg border transition-all',
                  i === active ? 'ring-primary ring-2' : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile info */}
      <Card className="justify-between">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardDescription className="mb-1">پیرایشگاه</CardDescription>
              <CardTitle className="text-2xl font-bold md:text-3xl">{barber.shopName}</CardTitle>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{barber.barberName}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <span className="flex items-center gap-1.5">
              <Star className="text-amber-400 fill-amber-400 size-4.5" />
              <span className="text-lg font-bold">{toFa(barber.rating)}</span>
              <span className="text-muted-foreground text-sm">از {toFa(barber.ratingMax)}</span>
            </span>
            <span className="text-muted-foreground text-sm">
              ({toFa(barber.reviewCount)} نظر)
            </span>
          </div>

          <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4" />
            {barber.address}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={barber.status} />
            {barber.statusNote && (
              <span className="text-muted-foreground text-xs">{barber.statusNote}</span>
            )}
          </div>

          {barber.about && <p className="text-muted-foreground text-sm leading-6">{barber.about}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <BookingTrigger
              state={barber.bookingState}
              size="lg"
              className="flex-1 rounded-xl"
            />
            <Button variant="outline" size="lg" className="flex-1 rounded-xl" asChild>
              <a href="#reviews">مشاهده نظرات</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function toFa(v: number): string {
  return v.toLocaleString('fa-IR')
}
