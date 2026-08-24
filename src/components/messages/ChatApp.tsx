'use client'

import {
  ArrowRight,
  Check,
  CheckCheck,
  LoaderCircle,
  MessagesSquare,
  SendHorizontal,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { ChatConversation, ChatMessage, MeInfo } from '@/lib/chat-types'
import { senderId } from '@/lib/chat-types'
import { cn } from '@/utils/cn'

const LIST_POLL_MS = 15000
const THREAD_POLL_MS = 8000

export function ChatApp({ me }: { me: MeInfo }) {
  const router = useRouter()

  const [convos, setConvos] = useState<ChatConversation[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingConvo, setPendingConvo] = useState<ChatConversation | null>(null)

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { docs: ChatConversation[] }
      setConvos(data.docs)
      setListError(null)
    } catch {
      setListError('خطا در دریافت گفتگوها؛ دوباره تلاش کنید.')
    }
  }, [])

  useEffect(() => {
    const barberId = new URLSearchParams(window.location.search).get('barber')
    const start = async () => {
      if (barberId) {
        router.replace('/messages')
        try {
          const res = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barberId }),
          })
          if (res.ok) {
            const convo = (await res.json()) as ChatConversation
            setPendingConvo(convo)
            setActiveId(convo.id)
          }
        } catch {
          /* fall through to plain list */
        }
      }
      await loadList()
    }
    void start()
  }, [loadList, router])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void loadList()
    }, LIST_POLL_MS)
    return () => clearInterval(t)
  }, [loadList])

  const activeConvo =
    convos?.find((c) => c.id === activeId) ?? (activeId ? pendingConvo : null)

  return (
    <div className="bg-background border-border mx-auto flex w-full overflow-hidden border-y md:my-8 md:h-[calc(100dvh-11rem)] md:max-w-5xl md:min-h-[520px] md:rounded-3xl md:border md:shadow-sm h-[calc(100dvh-8rem-env(safe-area-inset-bottom))]">
      {/* Conversation list */}
      <aside
        className={cn(
          'flex w-full flex-col md:w-[340px] md:shrink-0 md:border-e',
          activeId && 'hidden md:flex',
        )}
      >
        <div className="border-b px-4 py-3.5">
          <h1 className="text-base font-bold">پیام‌ها</h1>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!convos && !listError && (
            <div className="space-y-1 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-2.5">
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {listError && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">{listError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadList()}>
                تلاش مجدد
              </Button>
            </div>
          )}

          {convos?.length === 0 && !listError && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                <MessagesSquare className="size-7" />
              </span>
              <p className="text-sm font-semibold">هنوز گفتگی ندارید</p>
              <p className="text-muted-foreground text-sm leading-6">
                برای شروع گفتگو، صفحه آرایشگر مورد نظرتان را باز کنید و دکمه پیام را بزنید.
              </p>
            </div>
          )}

          {convos && convos.length > 0 && (
            <ul>
              {convos.map((c) => (
                <li key={c.id}>
                  <ConversationRow
                    conversation={c}
                    active={c.id === activeId}
                    onSelect={() => setActiveId(c.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread pane */}
      <section className={cn('min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden md:flex')}>
        {activeConvo ? (
          <ChatThread
            key={activeConvo.id}
            me={me}
            conversation={activeConvo}
            onBack={() => setActiveId(null)}
            onActivity={loadList}
          />
        ) : activeId ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-muted-foreground size-7 animate-spin" />
          </div>
        ) : (
          <EmptyThreadPane />
        )}
      </section>
    </div>
  )
}

function ConversationRow({
  conversation: c,
  active,
  onSelect,
}: {
  conversation: ChatConversation
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-start transition-colors',
        active && 'bg-muted',
      )}
    >
      <Avatar className="border-input size-11 shrink-0 border">
        {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt={c.title} /> : null}
        <AvatarFallback>{c.title.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{c.title}</span>
          <span className="text-muted-foreground shrink-0 text-[11px]">
            {listTime(c.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-xs',
              c.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
          >
            {c.lastMessage || 'گفتگوی جدید'}
          </p>
          {c.unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold">
              {c.unreadCount.toLocaleString('fa-IR')}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function EmptyThreadPane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <MessagesSquare className="size-7" />
      </span>
      <p className="font-semibold">یک گفتگو را انتخاب کنید</p>
      <p className="text-muted-foreground max-w-xs text-sm leading-6">
        پیام‌های رد و بدل شده بین شما و طرف مقابل اینجا نمایش داده می‌شود.
      </p>
    </div>
  )
}

function ChatThread({
  me,
  conversation,
  onBack,
  onActivity,
}: {
  me: MeInfo
  conversation: ChatConversation
  onBack: () => void
  onActivity: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { docs: ChatMessage[] }
      setMessages(data.docs)
      setLoadError(false)
      onActivity()
    } catch {
      setLoadError(true)
    }
  }, [conversation.id, onActivity])

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
  }, [messages])

  const send = async () => {
    const content = draft.trim()
    if (!content || sending) return

    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      sender: me.id,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: true,
    }

    setDraft('')
    stickRef.current = true
    setSending(true)
    setMessages((prev) => [...(prev ?? []), optimistic])

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error()
      const doc = (await res.json()) as ChatMessage
      setMessages((prev) => (prev ?? []).map((m) => (m.id === tempId ? doc : m)))
      onActivity()
    } catch {
      // Put the text back so nothing the user wrote is lost.
      setMessages((prev) => (prev ?? []).filter((m) => m.id !== tempId))
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  const groups = useMemo(() => groupByDay(messages ?? []), [messages])
  const isEmpty = messages !== null && messages.length === 0

  return (
    <>
      <header className="bg-background/95 border-b px-2 py-2 backdrop-blur md:px-4">
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
          <Avatar className="size-10 shrink-0 border">
            {conversation.avatarUrl ? (
              <AvatarImage src={conversation.avatarUrl} alt={conversation.title} />
            ) : null}
            <AvatarFallback>{conversation.title.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{conversation.title}</p>
            {conversation.subtitle && (
              <p className="text-muted-foreground truncate text-xs">{conversation.subtitle}</p>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="bg-muted/30 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-6"
      >
        {messages === null && !loadError && <ThreadSkeleton />}

        {loadError && messages === null && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-muted-foreground text-sm">خطا در دریافت پیام‌ها.</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              تلاش مجدد
            </Button>
          </div>
        )}

        {isEmpty && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground rounded-full bg-background px-4 py-2 text-center text-xs shadow-sm">
              اولین پیام را بفرستید 👋
            </p>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.key} className="space-y-1">
            <div className="sticky top-1 z-10 flex justify-center py-1">
              <span className="bg-background/90 text-muted-foreground rounded-full border px-3 py-0.5 text-[11px] shadow-xs backdrop-blur">
                {g.label}
              </span>
            </div>
            {g.items.map((m) => (
              <Bubble key={m.id} message={m} mine={senderId(m) === me.id} />
            ))}
          </div>
        ))}
      </div>

      <form
        className="bg-background border-t p-2 md:p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
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
            placeholder="پیام خود را بنویسید…"
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
      </form>
    </>
  )
}

function Bubble({ message: m, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'shadow-xs max-w-[82%] rounded-2xl px-3.5 py-2 md:max-w-[65%]',
          mine ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-card rounded-ss-md',
          m.pending && 'opacity-70',
        )}
      >
        <p className="text-sm leading-6 break-words whitespace-pre-wrap">{m.content}</p>
        <span
          className={cn(
            'mt-0.5 flex items-center justify-end gap-1 text-[10px]',
            mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {faClock(m.createdAt)}
          {mine &&
            !m.pending &&
            (m.readAt ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
        </span>
      </div>
    </div>
  )
}

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="mx-auto h-5 w-24 rounded-full" />
      <Skeleton className="me-auto h-10 w-52 rounded-2xl" />
      <Skeleton className="ms-auto h-12 w-64 rounded-2xl" />
      <Skeleton className="h-10 w-48 rounded-2xl" />
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

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'امروز'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'دیروز'
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}

type DayGroup = { key: string; label: string; items: ChatMessage[] }

function groupByDay(messages: ChatMessage[]): DayGroup[] {
  const out: DayGroup[] = []
  let current: DayGroup | null = null
  for (const m of messages) {
    const label = dayLabel(m.createdAt)
    if (!current || current.label !== label) {
      current = { key: `${label}-${out.length}`, label, items: [] }
      out.push(current)
    }
    current.items.push(m)
  }
  return out
}
