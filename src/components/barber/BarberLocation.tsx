'use client'

import { MapPin, Navigation, Copy, Check } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { SectionHeading } from './SectionHeading'

export function BarberLocation({
  address,
  region,
  coordinates,
}: {
  address: string
  region?: string
  coordinates?: { lat: number; lng: number }
}) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : encodeURIComponent(address)
  const mapSrc = coordinates
    ? `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${query}&z=16&output=embed`
  const dirHref = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${query}`

  return (
    <section id="location" className="scroll-mt-20">
      <SectionHeading title="آدرس" subtitle="موقعیت آرایشگاه روی نقشه" />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="gap-0 overflow-hidden p-0">
          <iframe
            title="نقشه آرایشگاه"
            src={mapSrc}
            className="h-72 w-full border-0 lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>

        <Card className="gap-0">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="font-semibold">آدرس آرایشگاه</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{address}</p>
              </div>
            </div>

            {region && (
              <p className="text-muted-foreground text-sm">منطقه: {region}</p>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <Button asChild className="w-full rounded-xl">
                <a href={dirHref} target="_blank" rel="noopener noreferrer">
                  <Navigation className="size-4" />
                  مسیریابی
                </a>
              </Button>
              <Button variant="outline" onClick={copyAddress} className="w-full rounded-xl">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'کپی شد' : 'کپی آدرس'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
