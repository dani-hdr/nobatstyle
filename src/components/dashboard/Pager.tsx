'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

/**
 * Button-based pagination for client-fetched dashboard lists (refetches data
 * instead of navigating to a new URL).
 */
export function Pager({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) return null

  const pages = getPageWindow(page, totalPages)

  return (
    <nav aria-label="صفحه‌بندی" className={cn('mt-6 flex items-center justify-center gap-1.5', className)}>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="صفحه قبل"
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="text-muted-foreground px-1 text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon-sm"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(p !== page && 'hover:bg-muted')}
          >
            {p.toLocaleString('fa-IR')}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="صفحه بعد"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
    </nav>
  )
}

/** Returns a window of page numbers around the current page, with ellipses. */
function getPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return range(1, total)

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
