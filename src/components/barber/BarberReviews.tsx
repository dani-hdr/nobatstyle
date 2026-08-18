'use client'

import { BadgeCheck, Star } from 'lucide-react'
import * as React from 'react'
import { useMemo, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PREVIEW_LIMITS, type BarberReview } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { SectionHeading } from './SectionHeading'

export function BarberReviews({
  reviews,
  rating,
  ratingMax,
}: {
  reviews: BarberReview[]
  rating: number
  ratingMax: number
}) {
  const [allOpen, setAllOpen] = useState(false)
  const visible = reviews.slice(0, PREVIEW_LIMITS.reviews)
  const hasMore = reviews.length > PREVIEW_LIMITS.reviews

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]
    reviews.forEach((r) => {
      const idx = Math.max(0, Math.min(4, Math.round(r.rating) - 1))
      buckets[idx] += 1
    })
    return buckets.reverse() // 5 -> 1
  }, [reviews])

  return (
    <section id="reviews" className="scroll-mt-20">
      <SectionHeading
        title="نظرات مشتریان"
        subtitle={`میانگین امتیاز ${toFa(rating)} از ${toFa(ratingMax)}`}
        action={
          hasMore ? (
            <Button variant="ghost" onClick={() => setAllOpen(true)}>
              مشاهده همه
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Summary */}
        <div className="border bg-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold">{toFa(rating)}</span>
            <div>
              <div className="flex gap-0.5">
                {Array.from({ length: ratingMax }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-4',
                      i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted',
                    )}
                  />
                ))}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{toFa(reviews.length)} نظر</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {distribution.map((count, i) => {
              const total = reviews.length || 1
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-3 shrink-0">{toFa(5 - i)}</span>
                  <Progress value={(count / total) * 100} className="h-1.5" />
                  <span className="text-muted-foreground w-4 text-start">{toFa(count)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {hasMore && (
            <div className="text-center">
              <Button variant="ghost" onClick={() => setAllOpen(true)}>
                مشاهده همه نظرات
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>همه نظرات</DialogTitle>
            <DialogDescription>{toFa(reviews.length)} نظر برای این آرایشگر</DialogDescription>
          </DialogHeader>
          <div className="max-h-[65dvh] space-y-3 overflow-y-auto">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ReviewCard({ review }: { review: BarberReview }) {
  return (
    <div className="border bg-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          {review.avatar?.url ? (
            <AvatarImage src={review.avatar.url} alt={review.avatar.alt ?? review.customerName} />
          ) : null}
          <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{review.customerName}</p>
              {review.verifiedBooking && (
                <Badge variant="success" className="gap-1">
                  <BadgeCheck className="size-3" />
                  نوبت تایید شده
                </Badge>
              )}
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="text-amber-400 fill-amber-400 size-3.5" />
              {toFaD(review.rating)}
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{review.text}</p>
          <p className="text-muted-foreground mt-2 text-xs">{toFaDate(review.date)}</p>
        </div>
      </div>
    </div>
  )
}

function toFa(v: number): string {
  return v.toLocaleString('fa-IR')
}

function toFaD(v: number): string {
  return v.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function toFaDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}
