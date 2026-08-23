'use client'

import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import type { BarberImage } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { ImageLightbox } from './ImageLightbox'

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // The cover is only a backdrop; the lightbox cycles through gallery images.
  const current = gallery[active]

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
        {/* Cover photo as the box backdrop */}
        <Image
          src={coverImage.url}
          alt=""
          fill
          priority
          sizes="(min-width:1024px) 50vw, 100vw"
          aria-hidden
          className="scale-110 object-cover brightness-75 blur-md"
        />
        <div className="absolute inset-0 bg-black/10" />

        {current && (
          <button
            type="button"
            onClick={() => setLightboxIndex(active)}
            aria-label="مشاهده گالری"
            className="group absolute inset-3 cursor-zoom-in md:inset-5"
          >
            <span className="relative block size-full overflow-hidden rounded-xl shadow-lg">
              <Image
                src={current.url}
                alt={current.alt}
                fill
                priority
                sizes="(min-width:1024px) 45vw, 90vw"
                className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
              />
            </span>
          </button>
        )}
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

      <ImageLightbox
        images={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
