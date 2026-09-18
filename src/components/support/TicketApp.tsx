'use client'

import {
  ArrowRight,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Plus,
  RotateCcw,
  SendHorizontal,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type {
  TicketCategory,
  TicketDetail,
  TicketMe,
  TicketMessage,
  TicketSummary,
} from '@/lib/ticket-types'
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_META,
} from '@/lib/ticket-types'
import { cn } from '@/utils/cn'

const LIST_POLL_MS = 15000
const THREAD_POLL_MS = 10000

export function TicketApp({ me }: { me: TicketMe }) {
  const staff = me.role === 'admin'
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/support/tickets', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { docs: TicketSummary[] }
      setTickets(data.docs)
      setListError(null)
    } catch {
      setListError('خطا در دریافت تیکت‌ها؛ دوباره تلاش کنید.')
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void loadList()
    }, LIST_POLL_MS)
    return () => clearInterval(t)
  }, [loadList])

  const handleCreated = useCallback(
    (ticket: TicketDetail) => {
      setCreateOpen(false)
      setTickets((prev) => (prev ? [ticket, ...prev] : [ticket]))
      setActiveId(ticket.id)
    },
    [],
  )

  return (
    <div className="bg-background border-border mx-auto flex min-h-screen w-full overflow-hidden border-y md:my-8 md:h-[calc(100dvh-11rem)] md:max-w-5xl md:min-h-[520px] md:rounded-3xl md:border md:shadow-sm">
      {/* Ticket list */}
      <aside
        className={cn(
          'flex w-full flex-col md:w-[340px] md:shrink-0 md:border-e',
          activeId && 'hidden md:flex',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h1 className="text-base font-bold">پشتیبانی</h1>
          {!staff && (
            <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              تیکت جدید
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!tickets && !listError && <ListSkeleton />}

          {listError && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">{listError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadList()}>
                تلاش مجدد
              </Button>
            </div>
          )}

          {tickets?.length === 0 && !listError && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                <LifeBuoy className="size-7" />
              </span>
              <p className="text-sm font-semibold">تیکتی وجود ندارد</p>
              <p className="text-muted-foreground text-sm leading-6">
                {staff
                  ? 'تیکت جدید کاربران اینجا نمایش داده می‌شود.'
                  : 'برای ارتباط با پشتیبانی، یک تیکت جدید ثبت کنید.'}
              </p>
            </div>
          )}

          {tickets && tickets.length > 0 && (
            <ul>
              {tickets.map((t) => (
                <li key={t.id}>
                  <TicketRow ticket={t} active={t.id === activeId} onSelect={() => setActiveId(t.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread pane */}
      <section className={cn('min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden md:flex')}>
        {activeId ? (
          <TicketThread
            key={activeId}
            me={me}
            ticketId={activeId}
            onBack={() => setActiveId(null)}
            onActivity={loadList}
          />
        ) : (
          <EmptyThreadPane />
        )}
      </section>

      {!staff && (
        <NewTicketDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      )}
    </div>
  )
}

function TicketRow({
  ticket,
  active,
  onSelect,
}: {
  ticket: TicketSummary
  active: boolean
  onSelect: () => void
}) {
  const status = TICKET_STATUS_META[ticket.status]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'hover:bg-muted/60 flex w-full flex-col gap-1.5 border-b px-4 py-3 text-start transition-colors last:border-b-0',
        active && 'bg-muted',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{ticket.subject}</span>
        <span className="text-muted-foreground shrink-0 text-[11px]">
          {listTime(ticket.lastMessageAt)}
        </span>
      </div>
      <p className="text-muted-foreground line-clamp-1 text-xs">
        {ticket.lastFrom === 'staff' && <span className="text-foreground/70">پشتیبانی: </span>}
        {ticket.lastMessage || '—'}
      </p>
      <div className="flex items-center gap-1.5">
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="text-muted-foreground text-[11px]">
          {TICKET_CATEGORY_LABELS[ticket.category]}
        </span>
      </div>
    </button>
  )
}

function EmptyThreadPane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <LifeBuoy className="size-7" />
      </span>
      <p className="font-semibold">یک تیکت را انتخاب کنید</p>
      <p className="text-muted-foreground max-w-xs text-sm leading-6">
        گفتگوی شما با تیم پشتیبانی اینجا نمایش داده می‌شود.
      </p>
    </div>
  )
}

function TicketThread({
  me,
  ticketId,
  onBack,
  onActivity,
}: {
  me: TicketMe
  ticketId: string
  onBack: () => void
  onActivity: () => void
}) {
  const staff = me.role === 'admin'
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setTicket((await res.json()) as TicketDetail)
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [ticketId])

  useEffect(() => {
    stickRef.current = true
    void load()
  }, [load])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, THREAD_POLL_MS)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickRef.current) return
    el.scrollTop = el.scrollHeight
  }, [ticket?.messages])

  const setStatus = async (action: 'close' | 'reopen') => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/${action}`, { method: 'POST' })
      if (res.ok) {
        setTicket((await res.json()) as TicketDetail)
        onActivity()
      }
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    const body = draft.trim()
    if (!body || sending || ticket?.status === 'closed') return

    const tempId = `temp-${Date.now()}`
    const optimistic: TicketMessage = {
      id: tempId,
      from: staff ? 'staff' : 'user',
      body,
      createdAt: new Date().toISOString(),
    }

    setDraft('')
    stickRef.current = true
    setSending(true)
    setTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev,
    )

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      })
      if (!res.ok) throw new Error()
      setTicket((await res.json()) as TicketDetail)
      onActivity()
    } catch {
      setTicket((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev,
      )
      setDraft(body)
    } finally {
      setSending(false)
    }
  }

  if (loadError && !ticket) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground text-sm">خطا در دریافت تیکت.</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          تلاش مجدد
        </Button>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircle className="text-muted-foreground size-7 animate-spin" />
      </div>
    )
  }

  const status = TICKET_STATUS_META[ticket.status]
  const closed = ticket.status === 'closed'

  return (
    <>
      <header className="bg-background/95 border-b px-3 py-2.5 backdrop-blur md:px-4">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="بازگشت"
            className="md:hidden"
          >
            <ArrowRight className="size-4.5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{ticket.subject}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-muted-foreground text-[11px]">
                {TICKET_CATEGORY_LABELS[ticket.category]}
              </span>
              {staff && ticket.priority !== 'normal' && (
                <span className="text-muted-foreground text-[11px]">
                  · اولویت {TICKET_PRIORITY_LABELS[ticket.priority]}
                </span>
              )}
            </div>
          </div>
          {closed ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              disabled={busy}
              onClick={() => void setStatus('reopen')}
            >
              <RotateCcw className="size-4" />
              باز کردن
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              disabled={busy}
              onClick={() => void setStatus('close')}
            >
              <Lock className="size-4" />
              بستن
            </Button>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="bg-muted/30 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 md:px-6"
      >
        {ticket.messages.map((m) => (
          <Bubble key={m.id} message={m} mine={staff ? m.from === 'staff' : m.from === 'user'} />
        ))}
      </div>

      <form
        className="bg-background border-t p-2 md:p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        {closed ? (
          <p className="text-muted-foreground py-2 text-center text-xs">
            این تیکت بسته شده است. برای ادامه، آن را باز کنید.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  window.matchMedia('(min-width: 768px)').matches
                ) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder="پاسخ خود را بنویسید…"
              rows={1}
              maxLength={2000}
              className="max-h-32 min-h-10 py-2.5"
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={!draft.trim() || sending}
              aria-label="ارسال پیام"
            >
              {sending ? (
                <LoaderCircle className="size-4.5 animate-spin" />
              ) : (
                <SendHorizontal className="size-4.5 -scale-x-100" />
              )}
            </Button>
          </div>
        )}
      </form>
    </>
  )
}

function Bubble({ message, mine }: { message: TicketMessage; mine: boolean }) {
  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'shadow-xs max-w-[82%] rounded-2xl px-3.5 py-2 md:max-w-[65%]',
          mine ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-card rounded-ss-md',
          message.id.startsWith('temp-') && 'opacity-70',
        )}
      >
        {!mine && (
          <span className="text-muted-foreground mb-0.5 block text-[10px] font-medium">پشتیبانی</span>
        )}
        <p className="text-sm leading-6 break-words whitespace-pre-wrap">{message.body}</p>
        <span
          className={cn(
            'mt-0.5 block text-end text-[10px]',
            mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {faClock(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (ticket: TicketDetail) => void
}) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('general')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubject('')
      setCategory('general')
      setMessage('')
      setError(null)
      setPending(false)
    }
  }, [open])

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !pending

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, message: message.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        errors?: { message?: string }[]
      }
      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message ?? 'ثبت تیکت ممکن نشد.')
      }
      onCreated(data as TicketDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت تیکت ممکن نشد.')
    } finally {
      setPending(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <DialogHeader className="border-b p-4">
        <DialogTitle className="text-base">تیکت جدید</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="ticket-subject">موضوع *</Label>
          <Input
            id="ticket-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            placeholder="خلاصه‌ای از مشکل یا سوال"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-category">دسته‌بندی</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)} dir="rtl">
            <SelectTrigger id="ticket-category" className="w-full">
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-message">پیام *</Label>
          <Textarea
            id="ticket-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="جزئیات درخواست خود را بنویسید…"
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            انصراف
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <SendHorizontal className="size-4 -scale-x-100" />}
            ارسال تیکت
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      ))}
    </div>
  )
}

/* ---------- time helpers ---------- */

function faClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

function listTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return faClock(iso)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'دیروز'
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}
