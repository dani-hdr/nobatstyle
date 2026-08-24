'use client'

import { LoaderCircle, MessageSquarePlus, MessageSquareText, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { BarberComment } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { SectionHeading } from './SectionHeading'

const MAX_LENGTH = 500

export function BarberComments({
  barberId,
  comments,
  total,
  rating,
  reviewCount,
}: {
  barberId: string
  comments: BarberComment[]
  total: number
  rating?: number
  reviewCount?: number
}) {
  const [items, setItems] = useState(comments)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const hasMore = items.length < total

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/comments?barber=${barberId}&page=${page + 1}`)
      if (res.ok) {
        const data = await res.json()
        setItems((prev) => [...prev, ...(data.comments ?? [])])
        setPage((p) => p + 1)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section id="comments" className="scroll-mt-20">
      <SectionHeading
        title="دیدگاه‌ها"
        subtitle={
          rating != null && reviewCount != null && reviewCount > 0
            ? `میانگین امتیاز ${toFa(rating)} از ${toFa(reviewCount)} دیدگاه`
            : 'دیدگاه خود را درباره این آرایشگر بنویسید'
        }
        action={
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            <MessageSquarePlus className="size-4" />
            ثبت دیدگاه
          </Button>
        }
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 p-6 text-center text-sm">
          <MessageSquareText className="size-4" />
          هنوز دیدگاهی ثبت نشده است؛ اولین نفر باشید.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore && <LoaderCircle className="size-4 animate-spin" />}
                نمایش بیشتر
              </Button>
            </div>
          )}
        </>
      )}

      <AddCommentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        barberId={barberId}
      />
    </section>
  )
}

function CommentRow({ comment }: { comment: BarberComment }) {
  return (
    <div className="border bg-card rounded-xl px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{comment.authorName}</span>
          {typeof comment.rating === 'number' && (
            <span className="flex items-center gap-0.5 text-xs font-semibold">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {toFa(comment.rating)}
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-xs">{toFaDate(comment.date)}</span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-sm leading-6">{comment.text}</p>
    </div>
  )
}

function AddCommentModal({
  open,
  onOpenChange,
  barberId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  barberId: string
}) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [success, setSuccess] = useState(false)

  const close = () => {
    onOpenChange(false)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!rating || !text || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barber: barberId, content: text, rating }),
      })

      if (res.status === 401) {
        setNeedsAuth(true)
        setError('برای ثبت دیدگاه ابتدا باید وارد حساب خود شوید.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || 'ثبت دیدگاه ممکن نشد؛ دوباره تلاش کنید.')
        return
      }

      // New comments need admin approval before they appear publicly.
      setSuccess(true)
      setContent('')
      setRating(0)
      setTimeout(close, 1800)
    } catch {
      setError('خطا در برقراری ارتباط؛ دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="md:max-w-lg">
      <div className="space-y-4 overflow-y-auto p-5 md:p-6">
        <div>
          <h2 className="text-lg font-bold">ثبت دیدگاه</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            دیدگاه شما پس از تأیید نمایش داده می‌شود.
          </p>
        </div>

        {success ? (
          <p className="text-emerald-500 bg-emerald-500/10 rounded-xl p-4 text-center text-sm">
            دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-muted-foreground text-sm">امتیاز شما</span>
              <div className="flex flex-row-reverse items-center gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} ستاره`}
                    onMouseEnter={() => setHovered(value)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(value)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'size-7',
                        value <= (hovered || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/40',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="نظر شما..."
              rows={4}
              maxLength={MAX_LENGTH}
              className="bg-background"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                {content.length.toLocaleString('fa-IR')}/{MAX_LENGTH.toLocaleString('fa-IR')}
              </span>
              <Button type="submit" disabled={submitting || !rating || !content.trim()}>
                {submitting && <LoaderCircle className="size-4 animate-spin" />}
                ارسال دیدگاه
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm">
                {error}{' '}
                {needsAuth && (
                  <Link href="/login" className="underline underline-offset-4">
                    ورود
                  </Link>
                )}
              </p>
            )}
          </form>
        )}
      </div>
    </ResponsiveModal>
  )
}

function toFa(v: number): string {
  return v.toLocaleString('fa-IR', { maximumFractionDigits: 1 })
}

function toFaDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
