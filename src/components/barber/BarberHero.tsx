'use client'

import { Check, Heart, MapPin, Share2, Star, UserCheck } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  type BarberProfile,
} from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { Container } from '../layout/Container'
import { BarberCoverGallery } from './BarberCoverGallery'
import { BarberStats } from './BarberStats'
import { StatusBadge } from './StatusBadge'
import { BookingTrigger } from './booking/BookingTrigger'

export function BarberHero({ barber }: { barber: BarberProfile }) {
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      {/* Profile info */}
      <Card className="relative overflow-hidden rounded-none md:rounded-2xl ">
        <div className='absolute inset-0 w-full h-full bg-linear-to-t from-primary  to-transparent z-10'></div>
        <Image className='absolute object-cover w-full h-full inset-0 z-0' alt='' src="/barber/nobat-rel1.svg" width={1000} height={1000} />
        <CardHeader className="gap-2 z-20 relative text-muted">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-16 shrink-0 ring-2 ring-white/40">
                {barber.avatar?.url ? (
                  <AvatarImage src={barber.avatar.url} alt={barber.avatar.alt ?? barber.shopName} />
                ) : null}
                <AvatarFallback>{barber.shopName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <CardDescription className="mb-1 text-muted">پیرایشگاه</CardDescription>
                <CardTitle className="text-2xl font-bold md:text-3xl">{barber.shopName}</CardTitle>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <ShareButton shopName={barber.shopName} />
              <LikeButton />
            </div>
          </div>
          <p className=" text-sm">{barber.barberName}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <span className="flex items-center gap-1.5">
              <Star className="text-amber-400 fill-amber-400 size-4.5" />
              <span className="text-lg font-bold">{toFa(barber.rating)}</span>
              <span className=" text-sm">از {toFa(barber.ratingMax)}</span>
            </span>
            <span className=" text-sm">
              ({toFa(barber.reviewCount)} نظر)
            </span>
          </div>

          <div className="text-muted mt-1 flex items-center gap-1.5 text-sm ">
            <MapPin className="size-4" />
            {barber.address}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 z-20 relative ">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={barber.status} />
            {barber.isYourBarber && (
              <Badge className="gap-1 border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
                <UserCheck className="size-3.5" />
                آرایشگر شما
              </Badge>
            )}
            {barber.statusNote && (
              <span className="text-muted text-xs">{barber.statusNote}</span>
            )}
          </div>

          {barber.about && <p className="text-muted text-sm leading-6">{barber.about}</p>}
          <BarberStats stats={barber.stats} />
        </CardContent>
        <CardFooter className='z-20 relative h-full'>
          <BookingTrigger
            state={barber.bookingState}
            size="lg"
            className='w-full mt-auto'
            variant={'secondary'}
          />
        </CardFooter>

      </Card>
      <Container className='md:px-0'>
        <BarberCoverGallery
          coverImage={barber.coverImage}
          gallery={barber.gallery}
          verified={barber.verified}
        />
      </Container>

    </div>
  )
}

function toFa(v: number): string {
  return v.toLocaleString('fa-IR')
}

function ShareButton({ shopName }: { shopName: string }) {
  const [copied, setCopied] = useState(false)

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shopName, url })
        return
      } catch {
        /* user cancelled share sheet */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShare}
          className="bg-white/10 text-white rounded-full backdrop-blur hover:bg-white/20 hover:text-white"
          aria-label={copied ? 'لینک کپی شد' : 'اشتراک‌گذاری'}
        >
          {copied ? <Check className="size-4.5" /> : <Share2 className="size-4.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'کپی شد' : 'اشتراک‌گذاری'}</TooltipContent>
    </Tooltip>
  )
}

function LikeButton() {
  const [liked, setLiked] = useState(false)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLiked((v) => !v)}
          className={cn(
            'bg-white/10 text-white rounded-full backdrop-blur hover:bg-white/20 hover:text-white',
            liked && 'bg-rose-500/30 hover:bg-rose-500/40',
          )}
          aria-label={liked ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
        >
          <Heart className={cn('size-4.5', liked && 'fill-rose-500 text-rose-500')} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{liked ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی'}</TooltipContent>
    </Tooltip>
  )
}
