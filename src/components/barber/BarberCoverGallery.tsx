'use client'

import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import type { BarberImage } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

export function BarberCoverGallery({
  coverImage,
  gallery,
  verified,
}: {
  coverImage: BarberImage
  gallery: BarberImage[]
  verified: boolean
}) {
  const [active, setActive] = useState(0)

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
        <Image
          src={gallery[active]?.url ?? coverImage.url}
          alt={gallery[active]?.alt ?? coverImage.alt}
          fill
          priority
          sizes="(min-width:1024px) 50vw, 100vw"
          className="object-cover transition-all duration-300"
        />
        {verified && (
          <Badge variant="secondary" className="bg-background/90 absolute top-3 start-3 gap-1 shadow-sm">
            <BadgeCheck className="size-3.5 text-emerald-500" />
            تایید شده
          </Badge>
        )}
      </div>

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
  )
}
