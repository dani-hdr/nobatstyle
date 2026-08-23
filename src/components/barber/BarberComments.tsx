'use client'

import { LoaderCircle, MessageSquareText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { BarberComment } from '@/lib/barber-profile'

import { SectionHeading } from './SectionHeading'

export function BarberComments({
  barberId,
  comments,
}: {
  barberId: string
  comments: BarberComment[]
}) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barber: barberId, content: text }),
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
    } catch {
      setError('خطا در برقراری ارتباط؛ دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="comments" className="scroll-mt-20">
      <SectionHeading title="دیدگاه‌ها" subtitle="دیدگاه خود را درباره این آرایشگر بنویسید" />

      <form onSubmit={onSubmit} className="mb-6 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="نظر شما..."
          rows={3}
          maxLength={500}
          className="bg-background"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {content.length.toLocaleString('fa-IR')}/{(500).toLocaleString('fa-IR')}
          </span>
          <Button type="submit" disabled={submitting || !content.trim()}>
            {submitting && <LoaderCircle className="size-4 animate-spin" />}
            ثبت دیدگاه
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
        {success && (
          <p className="text-emerald-500 text-sm">
            دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود.
          </p>
        )}
      </form>

      {comments.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 p-6 text-center text-sm">
          <MessageSquareText className="size-4" />
          هنوز دیدگاهی ثبت نشده است؛ اولین نفر باشید.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="py-0">
              <CardContent className="flex flex-col gap-1 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{comment.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(comment.date).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-6">{comment.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
